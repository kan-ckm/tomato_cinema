# 🍅 Tomato Cinema — Monorepo

Hệ thống backend cho nền tảng đặt vé xem phim **Tomato Cinema**, xây dựng theo kiến trúc **microservices** với [NestJS](https://nestjs.com), quản lý bằng [Turborepo](https://turborepo.dev) và [pnpm workspaces](https://pnpm.io/workspaces).

---

## 📁 Cấu trúc dự án

```
tomato_cinema/
├── apps/
│   ├── auth-service/           # Xác thực, phân quyền, quản lý người dùng
│   ├── gateway-service/        # API Gateway (REST → gRPC/RabbitMQ)
│   ├── notification-service/   # Gửi thông báo qua Email & SMS
│   ├── bot-service/            # Telegram Bot tích hợp
│   ├── web/                    # Frontend Next.js
│   └── docker/                 # Docker Compose hạ tầng (Postgres, RabbitMQ, Redis)
│
└── packages/
    ├── contracts/              # Shared types & Protobuf definitions
    ├── common/                 # Shared utilities, decorators, filters
    ├── core/                   # Core abstractions tái sử dụng
    ├── passport/               # JWT authentication strategy
    ├── ui/                     # Shared UI components (React)
    ├── eslint-config/          # ESLint config dùng chung
    └── typescript-config/      # tsconfig dùng chung
```

---

## 🏗️ Kiến trúc hệ thống

```
Client / Web
     │
     ▼
┌─────────────────┐
│  gateway-service│  ◄── REST API (HTTP)
│  (NestJS + gRPC)│
└────────┬────────┘
         │ gRPC / RabbitMQ
    ┌────┴──────────────────────┐
    ▼                           ▼
┌──────────────┐    ┌─────────────────────┐
│ auth-service │    │ notification-service│
│  PostgreSQL  │    │   Email + SMS       │
│  Redis       │    │   (Exolve API)      │
└──────────────┘    └─────────────────────┘
         │
    ┌────┴─────┐
    ▼          ▼
┌──────────┐  ┌────────────┐
│ RabbitMQ │  │ bot-service│
│ (queue)  │  │ (Telegram) │
└──────────┘  └────────────┘
```

---

## 🚀 Bắt đầu

### Yêu cầu hệ thống

- **Node.js** >= 20
- **pnpm** >= 9
- **Docker** & **Docker Compose**

### Cài đặt

```bash
# 1. Clone dự án
git clone <repo-url> && cd tomato_cinema

# 2. Cài dependencies
pnpm install

# 3. Khởi động hạ tầng (Postgres, Redis, RabbitMQ)
cd apps/docker && cp .env.example .env
# Điền thông tin vào .env
docker compose up -d

# 4. Tạo file .env cho từng service
cp apps/auth-service/.env.example apps/auth-service/.env
cp apps/notification-service/.env.example apps/notification-service/.env
# ... điền thông tin cần thiết
```

### Chạy môi trường Development

```bash
# Chạy tất cả services cùng lúc
pnpm dev

# Chạy từng service riêng lẻ
pnpm --filter auth-service dev
pnpm --filter gateway-service dev
pnpm --filter notification-service dev
```

### Build

```bash
# Build toàn bộ monorepo
pnpm build

# Build từng service
pnpm --filter auth-service build
```

---

## 🛠️ Tech Stack

| Lớp | Công nghệ |
|-----|-----------|
| Runtime | Node.js 20, TypeScript |
| Framework | NestJS 11 |
| Monorepo | Turborepo + pnpm workspaces |
| Database | PostgreSQL 16 + Prisma |
| Cache | Redis 8 |
| Message Broker | RabbitMQ 3 |
| RPC | gRPC (protobuf) |
| Email | Nodemailer + Handlebars templates |
| SMS | Exolve API (MTS) |
| Bot | Telegraf (Telegram) |
| Frontend | Next.js 16 |
| Validation | Zod, class-validator |
| Auth | JWT (access + refresh token) |
| Containerization | Docker Compose |

---

## 📦 Packages nội bộ

| Package | Mô tả |
|---------|-------|
| `@tomatocinema/contracts` | Types, interfaces & Protobuf-generated code dùng chung giữa các services |
| `@tomatocinema/common` | Decorators, filters, guards tái sử dụng |
| `@tomatocinema/core` | Core abstractions và base classes |
| `@tomatocinema/passport` | JWT strategy và authentication helpers |

---

## 📜 Scripts hữu ích

```bash
pnpm dev          # Chạy tất cả services ở chế độ watch
pnpm build        # Build toàn bộ dự án
pnpm lint         # Kiểm tra linting toàn bộ
pnpm check-types  # Kiểm tra TypeScript types
```

---

## 📄 License

Private — All rights reserved.
