# auth-service

Microservice xác thực và phân quyền cho hệ thống **Tomato Cinema**.

## Chức năng

- Đăng ký, đăng nhập tài khoản người dùng
- Xác thực OTP (Email & SMS)
- Quản lý JWT (access token + refresh token)
- Tích hợp Telegram OAuth
- Quản lý session với Redis
- Kết nối gRPC để phục vụ gateway-service
- Publish sự kiện tới RabbitMQ (ví dụ: `auth.otp.requested`)

## Tech Stack

- **NestJS** — Framework chính
- **PostgreSQL + Prisma** — Lưu trữ dữ liệu người dùng
- **Redis (ioredis)** — Lưu session, OTP cache
- **RabbitMQ** — Message broker cho các sự kiện
- **gRPC** — Giao tiếp nội bộ với gateway-service
- **`@tomatocinema/passport`** — JWT strategy dùng chung

## Cài đặt

```bash
cp .env.example .env
# Điền các giá trị vào .env
pnpm install
```

## Biến môi trường

| Biến                       | Mô tả                                      |
| -------------------------- | ------------------------------------------ |
| `DATABASE_URL`             | PostgreSQL connection string               |
| `DATABASE_HOST`            | Host của PostgreSQL                        |
| `DATABASE_PORT`            | Port của PostgreSQL                        |
| `DATABASE_USER`            | Username PostgreSQL                        |
| `DATABASE_PASSWORD`        | Password PostgreSQL                        |
| `DATABASE_NAME`            | Tên database                               |
| `GRPC_HOST`                | gRPC server host                           |
| `GRPC_PORT`                | gRPC server port                           |
| `RMQ_URL`                  | RabbitMQ connection URL                    |
| `REDIS_HOST`               | Redis host                                 |
| `REDIS_PORT`               | Redis port                                 |
| `REDIS_USER`               | Redis username                             |
| `REDIS_PASSWORD`           | Redis password                             |
| `PASSPORT_SECRET_KEY`      | Secret key cho JWT signing                 |
| `PASSPORT_ACCESS_TTL`      | TTL của access token (giây)                |
| `PASSPORT_REFRESH_TTL`     | TTL của refresh token (giây)               |
| `TELEGRAM_BOT_ID`          | ID của Telegram Bot                        |
| `TELEGRAM_BOT_TOKEN`       | Token của Telegram Bot                     |
| `TELEGRAM_BOT_USERNAME`    | Username Telegram Bot                      |
| `TELEGRAM_REDIRECT_ORIGIN` | Origin URL redirect sau đăng nhập Telegram |

## Chạy service

```bash
# Development (watch mode)
pnpm dev

# Debug
pnpm debug

# Production
pnpm build && pnpm start:prod
```

## Database

```bash
# Chạy migrations
pnpm prisma migrate dev

# Xem schema
pnpm prisma studio
```
