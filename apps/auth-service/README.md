# 🔐 Auth Service — Tomato Cinema Authentication & Authorization

Microservice đảm nhận vai trò hạt nhân trong việc **Xác thực (Authentication)**, **Phân quyền (Authorization)**, và **Quản lý Tài khoản** cho toàn bộ nền tảng **Tomato Cinema**. Service cung cấp gRPC API hiệu năng cao cho `gateway-service`, lưu trữ dữ liệu bền vững với **PostgreSQL (Prisma ORM)**, tối ưu tốc độ và session bằng **Redis**, và phát sự kiện bất đồng bộ qua **RabbitMQ**.

---

## 🏛️ Kiến trúc hệ thống (Auth Service Architecture)

```mermaid
flowchart TD
    GW["🚪 gateway-service"] -->|gRPC Request (auth.v1, account.v1)| AuthGrpc["gRPC Controllers\n(AuthController / AccountController)"]

    subgraph CoreAuth["🔐 auth-service Core"]
        direction TB
        AuthGrpc --> AuthSvc["AuthService"]
        AuthGrpc --> AccSvc["AccountService"]
        AuthSvc & AccSvc --> OtpSvc["OtpService (Tạo mã & Băm SHA-256)"]
        AuthSvc & AccSvc --> MsgSvc["MessagingService (RabbitMQ Producer)"]
        AuthSvc & AccSvc --> Passport["@tomatocinema/passport (JWT Signing)"]

        AuthSvc & AccSvc & OtpSvc --> UserRepo["UserRepository / AccountRepository"]
    end

    subgraph DataStorage["💾 Data & Cache Layer"]
        PG[("🐘 PostgreSQL (Prisma ORM)\nAccounts & PendingContactChanges")]
        Redis[("⚡ Redis (ioredis)\nSessions & OTP Cache")]
    end

    subgraph EventBroker["📨 Message Broker"]
        RMQ{{"🐇 RabbitMQ\ntomatocinema_queue"}}
    end

    UserRepo -->|Queries / Transactions| PG
    OtpSvc & AuthSvc -->|Get / Set / Expire| Redis
    MsgSvc -->|Emit: auth.otp.requested\naccount.email.changed\naccount.phone.changed| RMQ
    RMQ --> NotifSvc["🔔 notification-service (Email & SMS)"]
```

---

## 🗄️ Sơ đồ thực thể cơ sở dữ liệu (Database ERD)

```mermaid
erDiagram
    %% PostgreSQL Entities
    ACCOUNTS {
        string id PK "UUID, Khóa chính tự sinh"
        string phone UK "Số điện thoại (Unique, Nullable)"
        string email UK "Địa chỉ email (Unique, Nullable)"
        boolean is_phone_verifed "Đã xác thực OTP SĐT chưa"
        boolean is_email_verifed "Đã xác thực OTP Email chưa"
        enum role "Quyền: USER | ADMIN"
        string telegram_id UK "ID Telegram định danh (Nullable)"
        datetime created_at "Thời gian tạo tài khoản"
        datetime updated_at "Thời gian cập nhật gần nhất"
    }

    PENDING_CONTACT_CHANGES {
        string id PK "UUID"
        string type "Loại: 'email' | 'phone'"
        string value "Giá trị mới chờ xác thực"
        string code_hash "Mã OTP đã băm SHA-256"
        datetime expires_at "Thời điểm hết hạn OTP"
        string accountId FK "Khóa ngoại tới ACCOUNTS (Cascade Delete)"
        datetime created_at "Thời gian tạo yêu cầu"
        datetime updated_at "Thời gian cập nhật"
    }

    %% Redis Cache Entities
    REDIS_OTP_CACHE {
        string key PK "otp:{type}:{identifier}"
        string hash "Mã băm OTP"
        int ttl "Thời gian sống (ví dụ: 300s)"
    }

    REDIS_TELEGRAM_SESSION {
        string key PK "telegram:session:{sessionId}"
        string data "Thông tin đăng nhập tạm từ Telegram"
        int ttl "Thời gian sống session"
    }

    %% Quan hệ
    ACCOUNTS ||--o{ PENDING_CONTACT_CHANGES : "1 Account có nhiều yêu cầu thay đổi (@@unique([accountId, type]))"
    ACCOUNTS ||--o{ REDIS_OTP_CACHE : "cache OTP đăng nhập"
    ACCOUNTS ||--o{ REDIS_TELEGRAM_SESSION : "cache phiên đăng nhập bot"
```

---

## 🔄 Các luồng xử lý chính (Sequence Diagrams)

### 1. Luồng Gửi & Xác thực OTP (Passwordless Login)

```mermaid
sequenceDiagram
    autonumber
    participant GW as gateway-service
    participant Auth as auth-service
    participant Redis as ⚡ Redis
    participant RMQ as 🐇 RabbitMQ
    participant DB as 🐘 PostgreSQL

    GW->>Auth: gRPC SendOtp(type, identifier)
    Auth->>Auth: Sinh mã OTP ngẫu nhiên 6 số & băm SHA-256
    Auth->>Redis: Lưu OTP hash với TTL 5 phút
    Auth->>RMQ: Publish event 'auth.otp.requested' { type, identifier, code }
    Auth-->>GW: { ok: true }

    GW->>Auth: gRPC VerifyOtp(type, identifier, code)
    Auth->>Redis: Lấy OTP hash & đối chiếu
    alt OTP Hợp lệ
        Auth->>DB: Tìm hoặc Tạo mới Account (upsert)
        Auth->>Auth: Sinh cặp Access Token + Refresh Token (@tomatocinema/passport)
        Auth->>Redis: Lưu Refresh Token / Phiên đăng nhập
        Auth-->>GW: { accessToken, refreshToken }
    else OTP Không hợp lệ / Hết hạn
        Auth-->>GW: gRPC Error (INVALID_ARGUMENT / NOT_FOUND)
    end
```

### 2. Luồng Cập nhật Email / Số điện thoại 2 bước

```mermaid
sequenceDiagram
    autonumber
    participant GW as gateway-service
    participant Auth as auth-service
    participant DB as 🐘 PostgreSQL
    participant RMQ as 🐇 RabbitMQ

    Note over GW,RMQ: Bước 1: Yêu cầu đổi thông tin & Gửi mã xác nhận
    GW->>Auth: gRPC InitEmailChange({ userId, email })
    Auth->>DB: Kiểm tra email đã được ai dùng chưa
    Auth->>Auth: Sinh OTP 6 số & băm SHA-256
    Auth->>DB: Upsert vào bảng `pending_contact_changes` (Hạn 5 phút)
    Auth->>RMQ: Publish event 'account.email.changed' { email, code }
    Auth-->>GW: { ok: true }

    Note over GW,RMQ: Bước 2: Xác nhận mã OTP để hoàn tất thay đổi
    GW->>Auth: gRPC ConfirmEmailChange({ userId, email, code })
    Auth->>DB: Tìm yêu cầu trong `pending_contact_changes`
    Auth->>Auth: Đối chiếu mã hash OTP
    Auth->>DB: Cập nhật `email` và `is_email_verifed = true` trong bảng `accounts`
    Auth->>DB: Xóa bản ghi trong `pending_contact_changes`
    Auth-->>GW: { ok: true }
```

---

## 📡 gRPC Service Contracts

Microservice implement 2 gRPC Services được định nghĩa trong gói `@tomatocinema/contracts`:

### 1. `AuthService` (`auth.v1.proto`)

- `SendOtp(SendOtpRequest) -> Empty`
- `VerifyOtp(VerifyOtpRequest) -> AuthTokenResponse`
- `RefreshToken(RefreshTokenRequest) -> AuthTokenResponse`
- `TelegramInit(Empty) -> TelegramInitResponse`
- `TelegramVerify(TelegramVerifyRequest) -> TelegramVerifyResponse`
- `TelegramConsume(TelegramConsumeRequest) -> AuthTokenResponse`

### 2. `AccountService` (`account.v1.proto`)

- `InitEmailChange(InitEmailChangeRequest) -> Empty`
- `ConfirmEmailChange(ConfirmEmailChangeRequest) -> Empty`
- `InitPhoneChange(InitPhoneChangeRequest) -> Empty`
- `ConfirmPhoneChange(ConfirmPhoneChangeRequest) -> Empty`

---

## ⚙️ Biến môi trường (.env)

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

| Biến                       | Bắt buộc | Mặc định / Ví dụ                                                  | Mô tả                                          |
| :------------------------- | :------: | :---------------------------------------------------------------- | :--------------------------------------------- |
| `NODE_ENV`                 |    Có    | `development` / `production`                                      | Môi trường triển khai                          |
| `DATABASE_URL`             |    Có    | `postgresql://user:pass@localhost:5432/tomato_auth?schema=public` | Connection URL tới PostgreSQL                  |
| `DATABASE_HOST`            |    Có    | `localhost`                                                       | Host database PostgreSQL                       |
| `DATABASE_PORT`            |    Có    | `5432`                                                            | Port database PostgreSQL                       |
| `DATABASE_USER`            |    Có    | `postgres`                                                        | Username database                              |
| `DATABASE_PASSWORD`        |    Có    | `secret`                                                          | Mật khẩu database                              |
| `DATABASE_NAME`            |    Có    | `tomato_auth`                                                     | Tên database                                   |
| `GRPC_HOST`                |    Có    | `0.0.0.0`                                                         | Host gRPC server lắng nghe                     |
| `GRPC_PORT`                |    Có    | `50051`                                                           | Port gRPC server                               |
| `RMQ_URL`                  |    Có    | `amqp://user:pass@localhost:5672`                                 | RabbitMQ connection URL                        |
| `REDIS_HOST`               |    Có    | `localhost`                                                       | Host của Redis                                 |
| `REDIS_PORT`               |    Có    | `6379`                                                            | Port của Redis                                 |
| `REDIS_USER`               |  Không   | `default`                                                         | Username Redis (nếu có)                        |
| `REDIS_PASSWORD`           |  Không   | `redis_secret`                                                    | Password Redis                                 |
| `PASSPORT_SECRET_KEY`      |    Có    | `your-jwt-secret-key`                                             | Secret key ký và giải mã JWT Token             |
| `PASSPORT_ACCESS_TTL`      |    Có    | `900` (15 phút)                                                   | Thời gian sống Access Token (giây)             |
| `PASSPORT_REFRESH_TTL`     |    Có    | `2592000` (30 ngày)                                               | Thời gian sống Refresh Token (giây)            |
| `TELEGRAM_BOT_ID`          |    Có    | `123456789`                                                       | ID của Telegram Bot                            |
| `TELEGRAM_BOT_TOKEN`       |    Có    | `bot_token_secret`                                                | Token truy cập Telegram Bot API                |
| `TELEGRAM_BOT_USERNAME`    |    Có    | `TomatoCinemaBot`                                                 | Username của Telegram Bot                      |
| `TELEGRAM_REDIRECT_ORIGIN` |    Có    | `http://localhost:3000`                                           | Redirect origin sau khi đăng nhập qua Telegram |

---

## 🚀 Quản lý Database & Chạy Service

```bash
# 1. Chạy migrations cho database PostgreSQL
pnpm --filter auth-service prisma migrate dev

# 2. Mở Prisma Studio để xem và quản trị dữ liệu trực quan
pnpm --filter auth-service prisma studio

# 3. Chạy ở chế độ Development (Watch mode)
pnpm --filter auth-service dev

# 4. Chạy ở chế độ Debug
pnpm --filter auth-service debug

# 5. Build và Chạy Production
pnpm --filter auth-service build
pnpm --filter auth-service start:prod
```
