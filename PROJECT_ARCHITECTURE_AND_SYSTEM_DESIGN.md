# TOMATO CINEMA — ARCHITECTURE & SYSTEM DESIGN SPECIFICATION

> **Project Name:** Tomato Cinema (`tomato_cinema`)  
> **Repository:** Monorepo managed by Turborepo & pnpm  
> **Author:** tomato (Solo Developer Learning Project)  
> **Primary Architecture:** Distributed Microservices with gRPC, Event-Driven Architecture (RabbitMQ), Multi-Database PostgreSQL, Redis Caching, and End-to-End Observability.

---

## 1. System Overview & Architecture Tiers

Tomato Cinema is an online movie streaming & community platform built to simulate enterprise-grade distributed systems. The system decomposes functionality into dedicated, loosely coupled services communicating via high-performance gRPC (HTTP/2 + Protobuf) internally and exposing a clean RESTful API to external clients through an API Gateway.

```
+-------------------------------------------------------------------------+
|                           CLIENT & DOCS TIER                            |
|  +-----------------------------------+  +----------------------------+  |
|  | Web Client (apps/web)             |  | Tech Docs (apps/docs)      |  |
|  | Next.js 16 - React 19 (:3500)     |  | Next.js 16 (:3501)         |  |
|  +-----------------------------------+  +----------------------------+  |
+-------------------------------------------------------------------------+
                                     |
                                     | HTTP/1.1 REST + Cookies
                                     | HTTP/1.1 REST (Port 80/8080)
                                     v
+-------------------------------------------------------------------------+
|                    EDGE & REVERSE PROXY TIER (NGINX)                    |
|  - Rate Limiting Zones by Client IP ($binary_remote_addr)               |
|    + OTP & Critical Security: 1 req/min (burst 2)                       |
|    + Auth (Login/Register): 10 req/min (burst 5)                        |
|    + General API: 100 req/min (burst 20)                                |
|  - Returns HTTP 429 JSON before reaching Node.js Gateway               |
|  - SSL Termination / Header Forwarding (X-Real-IP, X-Forwarded-Proto)   |
+-------------------------------------------------------------------------+
                                     |
                                     | HTTP Internal (:4000)
                                     v
+-------------------------------------------------------------------------+
|                            API GATEWAY TIER                             |
|  +-------------------------------------------------------------------+  |
|  | apps/gateway-service (NestJS 11, Port 3000)                       |  |
|  | - Reverse Proxy & BFF (Backend for Frontend)                      |  |
|  | apps/gateway-service (NestJS 11, Port 4000)                       |  |
|  | - Pure Thin Gateway & BFF (Backend for Frontend, No Redis/DB)     |  |
|  | - Defense-in-depth In-Memory ThrottlerGuard (Zero External Deps)  |  |
|  | - Swagger OpenAPI Documentation (/docs)                           |  |
|  | - JWT Passport Authentication & Distributed RolesGuard           |  |
|  | - Cookie Parser (Refresh Token in HttpOnly Secure Cookie)        |  |
|  | - OpenTelemetry HttpMetricsInterceptor                            |  |
|  | - Global GrpcExceptionFilter (Maps gRPC status -> HTTP status)   |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
                    |                                  |
                    | gRPC (HTTP/2)                    | gRPC (HTTP/2)
                    | Port 50051                       | Port 50052
                    v                                  v
+--------------------------------------+   +------------------------------+
|             AUTH SERVICE             |   |         USER SERVICE         |
| apps/auth-service                    |   | apps/user-service            |
| - gRPC Port: 50051, Metrics: 9101    |   | - gRPC Port: 50052           |
| - Packages: auth.v1, account.v1      |   | - Package: users.v1          |
| - Passwordless OTP, Passwords        |   | - Profile CRUD, Avatars      |
| - Telegram SSO Bot Auth              |   | - TypeORM ORM                |
| - Token Rotation (Access/Refresh)    |   | - DB: users_db (PostgreSQL)  |
| - Prisma ORM                         |   +------------------------------+
| - DB: auth_db (PostgreSQL)           |                  ^
| - Cache: Redis 8                     |                  |
+--------------------------------------+                  |
      |                     |                             | gRPC 50052
      | AMQP Events         +-----------------------------+ (CreateUser on signup)
      | (RabbitMQ)
      v
+--------------------------------------+   +------------------------------+
|          EVENT BROKER TIER           |   |       TELEGRAM BOT TIER      |
| RabbitMQ 3.13 (AMQP: 5673, UI: 15673)|   | apps/bot-service             |
| Exchanges: auth.events               |   | - Telegraf Bot Framework     |
| Queues: notifications_queue          |   | - Telegram Login Verification|
+--------------------------------------+   | - Calls Auth Service gRPC    |
      |                                    +------------------------------+
      v
+--------------------------------------+
|         NOTIFICATION SERVICE         |
| apps/notification-service            |
| - Consumes: notifications_queue      |
| - Nodemailer SMTP (Handlebars HBS)   |
| - Exolve SMS API Integration         |
+--------------------------------------+

+-------------------------------------------------------------------------+
|                      OBSERVABILITY & MONITORING TIER                    |
|  - OpenTelemetry Collector (OTLP gRPC: 4317, HTTP: 4318)                |
|  - Prometheus (:9090) - Metrics scraping & Exemplars                    |
|  - Grafana Loki (:3100) - Centralized log aggregation                   |
|  - Grafana Tempo (:3200) - Distributed trace storage                    |
|  - Grafana (:3001) - Unified Observability Dashboards                   |
+-------------------------------------------------------------------------+
```

---

## 2. Monorepo Structure (Turborepo & pnpm Workspace)

```text
tomato_cinema/
├── apps/
│   ├── gateway-service/      # REST API Gateway (NestJS 11, Port 3000)
│   ├── auth-service/         # Identity & Access Management (gRPC 50051, Port 9101)
│   ├── user-service/         # User Profiles Management (gRPC 50052)
│   ├── notification-service/ # Async email/SMS worker (RabbitMQ AMQP)
│   ├── bot-service/          # Telegram Bot SSO integration
│   ├── web/                  # Web Client (Next.js 16 + React 19, Port 3500)
│   └── docs/                 # Documentation Site (Next.js 16, Port 3501)
│
├── packages/
│   ├── contracts/            # Protobuf definitions & generated ts-proto code
│   │   ├── proto/
│   │   │   ├── auth.proto    # auth.v1 service & messages
│   │   │   ├── account.proto # account.v1 service & messages
│   │   │   └── users.proto   # users.v1 service & messages
│   │   └── gen/              # TypeScript compiled interfaces
│   ├── common/               # Shared libraries: dynamic GrpcModule, RpcStatus, utils
│   ├── passport/             # Shared Passport authentication strategies & JWT helpers
│   ├── core/                 # Shared data transfer objects & models
│   ├── ui/                   # Shared React 19 UI component library
│   ├── eslint-config/        # Shared ESLint configuration
│   └── typescript-config/    # Shared tsconfig bases
│
├── docker/
│   ├── docker-compose.yml    # Root compose orchestrator using 'include'
│   ├── infra/                # PostgreSQL, Redis, RabbitMQ
│   ├── apps/                 # Dockerized backend services
│   └── observability/        # OpenTelemetry, Prometheus, Loki, Tempo, Grafana
│
├── turbo.json                # Turborepo task pipeline configuration
├── package.json              # Root package scripts
└── pnpm-workspace.yaml       # Monorepo workspace mapping
```

---

## 3. Database Architecture (Database-per-Service)

The project adheres to the Microservices **Database-per-Service** pattern. Each domain maintains its own database schema inside PostgreSQL 16 to guarantee loose coupling:

### 3.1. Auth Service Database (`auth_db` via Prisma ORM)

`apps/auth-service/prisma/schema.prisma`:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../generated"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

model Account {
  id                    String                 @id @default(uuid())
  phone                 String?                @unique
  email                 String?                @unique
  passwordHash          String?                @map("password_hash")
  isPhoneVerified       Boolean                @default(false) @map("is_phone_verifed")
  isEmailVerified       Boolean                @default(false) @map("is_email_verifed")
  role                  Role                   @default(USER)
  telegramId            String?                @unique @map("telegram_id")
  pendingContactChanges PendingContactChange[]
  createAt              DateTime               @default(now()) @map("created_at")
  updateAt              DateTime               @updatedAt @map("updated_at")
}

model PendingContactChange {
  id        String   @id @default(uuid())
  type      String   // 'email' | 'phone'
  value     String   // e.g. new email address or phone number
  codeHash  String   @map("code_hash")
  expiresAt DateTime @map("expires_at")
  account   Account? @relation(fields: [accountId], references: [id], onDelete: Cascade)
  accountId String?  @map("accountId")
  createAt  DateTime @default(now()) @map("created_at")
  updateAt  DateTime @updatedAt @map("updated_at")

  @@unique([accountId, type])
  @@map("pending_contact_changes")
}

enum Role {
  USER
  ADMIN

  @@map("roles")
}
```

### 3.2. User Service Database (`users_db` via TypeORM)

`apps/user-service/src/modules/users/entites/user.entity.ts`:

```typescript
@Entity({ name: "users" })
export class UserEntity {
  @PrimaryColumn("uuid")
  public id: string; // Same UUID as Account.id (Distributed 1-to-1 relationship)

  @Column({ type: "varchar", nullable: true })
  public name: string | null;

  @Column({ type: "varchar", nullable: true })
  public avatar: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  public createAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  public updatedAt: Date;
}
```

### 3.3. Redis Key Schema & TTL Rules

Redis (port 6379) serves as high-speed in-memory store for authentication state:

- `otp:email:<email>`: Stores SHA-256 hashed 6-digit OTP (TTL: 300s / 5 minutes).
- `otp:phone:<phone>`: Stores hashed OTP for SMS verification (TTL: 300s).
- `otp_throttle:<identifier>`: Rate-limit key ensuring max 1 OTP request per minute (TTL: 60s).
- `tg:session:<sessionId>`: Temporary state for Telegram Bot deep-link login.

---

## 4. Protobuf Contracts & Inter-Process Communication (gRPC)

Communication between Gateway and internal services is strictly governed by Protocol Buffers v3 contracts compiled via `ts-proto`:

### 4.1. `auth.proto` (`package auth.v1`)

- **Service:** `AuthService`
- **RPC Methods:**
  - `Register(RegisterRequest) returns (AuthResponse)`
  - `Login(LoginRequest) returns (AuthResponse)`
  - `Refresh(RefreshRequest) returns (RefreshResponse)`
  - `ForgotPassword(ForgotPasswordRequest) returns (ForgotPasswordResponse)`
  - `ResetPassword(ResetPasswordRequest) returns (ResetPasswordResponse)`
  - `ChangePassword(ChangePasswordRequest) returns (ChangePasswordResponse)`
  - `TelegramInit(google.protobuf.Empty) returns (TelegramInitResponse)`
  - `TelegramVerify(TelegramVerifyRequest) returns (TelegramVerifyResponse)`
  - `TelegramComplete(TelegramCompleteRequest) returns (TelegramCompleteResponse)`
  - `TelegramConsume(TelegramConsumeRequest) returns (TelegramConsumeResponse)`

### 4.2. `account.proto` (`package account.v1`)

- **Service:** `AccountService`
- **RPC Methods:**
  - `GetAccount(GetAccountRequest) returns (GetAccountResponse)`
  - `InitEmailChange(InitEmailChangeRequest) returns (InitEmailChangeResponse)`
  - `ConfirmEmailChange(ConfirmEmailChangeRequest) returns (ConfirmEmailChangeResponse)`
  - `InitPhoneChange(InitPhoneChangeRequest) returns (InitPhoneChangeResponse)`
  - `ConfirmPhoneChange(ConfirmPhoneChangeRequest) returns (ConfirmPhoneChangeResponse)`
- **Enums:** `RoleUser { USER = 0; ADMIN = 1; }`

### 4.3. `users.proto` (`package users.v1`)

- **Service:** `UsersService`
- **RPC Methods:**
  - `GetMe(GetMeRequest) returns (GetMeResponse)`
  - `CreateUser(CreateUserRequest) returns (CreateUserResponse)`
  - `PatchUser(PatchUserRequest) returns (PatchUserResponse)`

---

## 5. Core System Workflows

### 5.1. Passwordless OTP Registration & Login

1. **Client Request:** User submits Email/Phone to `POST /api/v1/auth/otp/send`.
2. **Gateway Forwarding:** Gateway routes to `AuthService.SendOtp()` via gRPC.
3. **Throttling & Generation:** Auth Service checks `otp_throttle` in Redis. If allowed, generates 6-digit random code, hashes it, and stores in Redis with 300s TTL.
4. **Async Event Publishing:** Auth Service publishes `auth.otp_requested` event to RabbitMQ exchange `auth.events`. Gateway returns `200 OK` in < 15ms.
5. **Notification Processing:** `notification-service` consumes message from `notifications_queue` and renders Handlebars template (`otp.hbs`) to dispatch email via Nodemailer.
6. **Verification & Issuance:** User enters OTP at `POST /api/v1/auth/otp/verify`. Auth Service validates against Redis, immediately consumes the key, creates Account record in Postgres if new, triggers `UsersService.CreateUser()` via gRPC, and returns Access Token (in JSON) + Refresh Token (in `HttpOnly` Secure Cookie).

### 5.2. Telegram SSO Authentication Flow

1. **Initiation:** Client calls `GET /api/v1/auth/telegram/init` to receive deep-link URL: `https://t.me/<bot_username>?start=<session_id>`.
2. **Bot Interaction:** User opens Telegram and hits `/start`. `bot-service` receives the webhook/polling event, validates hash signature with Bot Token, and requests contact sharing.
3. **Completion:** User shares contact, `bot-service` calls `AuthService.TelegramComplete()` via gRPC.
4. **Token Consumption:** Web client polls or calls `POST /api/v1/auth/telegram/consume` with `session_id` to retrieve tokens and sign in.

### 5.3. Refresh Token Rotation & Session Management

- **Access Token:** Short-lived JWT (15 minutes expiration) sent in `Authorization: Bearer <token>` header.
- **Refresh Token:** Long-lived token (7 days) stored exclusively in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie to mitigate XSS attacks.
- **Rotation:** Calling `POST /api/v1/auth/refresh` invalidates the old Refresh Token and issues a new pair of tokens.

---

## 6. Infrastructure & Observability Stack

The deployment environment is configured using Docker Compose with decoupled configurations:

### 6.1. Ports Matrix

| Service / Tool     | Container Port | Host Port        | Protocol    | Purpose                                     |
| :----------------- | :------------- | :--------------- | :---------- | :------------------------------------------ |
| **API Gateway**    | 3000           | `3000`           | HTTP/REST   | External client API & Swagger (`/docs`)     |
| **Auth Service**   | 50051 / 9101   | `50051` / `9101` | gRPC / HTTP | Auth RPC & Prometheus metrics               |
| **User Service**   | 50052          | `50052`          | gRPC        | Profile RPC                                 |
| **Web Frontend**   | 3000           | `3500`           | HTTP        | Next.js 16 Web application                  |
| **Docs Frontend**  | 3000           | `3501`           | HTTP        | Technical documentation                     |
| **PostgreSQL**     | 5432           | `5433`           | TCP         | Relational database (`auth_db`, `users_db`) |
| **Redis**          | 6379           | `6379`           | TCP         | Caching, session & rate-limiting store      |
| **RabbitMQ**       | 5672 / 15672   | `5673` / `15673` | AMQP / HTTP | Message Broker & Management UI              |
| **OTel Collector** | 4317 / 4318    | `4317` / `4318`  | gRPC / HTTP | OpenTelemetry telemetry receiver            |
| **Prometheus**     | 9090           | `9090`           | HTTP        | Metrics scraper & time-series storage       |
| **Grafana Loki**   | 3100           | `3100`           | HTTP        | Log shipping & search                       |
| **Grafana Tempo**  | 3200           | `3200`           | HTTP        | Distributed trace collection                |
| **Grafana UI**     | 3000           | `3001`           | HTTP        | Unified monitoring dashboards               |
