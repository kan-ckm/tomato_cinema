# notification-service

Microservice gửi thông báo cho hệ thống **Tomato Cinema** — xử lý gửi Email và SMS OTP.

## Chức năng

- Lắng nghe sự kiện từ **RabbitMQ** (ví dụ: `auth.otp.requested`)
- Gửi **Email OTP** qua SMTP với Handlebars template
- Gửi **SMS OTP** qua **Exolve API** (MTS)
- Cơ chế retry tự động khi gửi SMS thất bại (tối đa 3 lần)
- Structured logging với NestJS Logger

## Tech Stack

- **NestJS** — Framework chính
- **RabbitMQ (amqplib)** — Message consumer
- **Nodemailer + @nestjs-modules/mailer** — Gửi email
- **Handlebars** — Email template engine
- **Axios + @nestjs/axios** — Gọi Exolve SMS API
- **Zod** — Validate biến môi trường
- **`@tomatocinema/contracts`** — Shared event types

## Luồng xử lý OTP

```mermaid
flowchart TD
    Auth["🔐 auth-service"] -->|publish: auth.otp.requested| RMQ[("🐇 RabbitMQ\ntomatocinema_queue")]
    RMQ --> Notif["🔔 notification-service\n(Consumer)"]

    Notif -->|type === 'email'| Mail["✉️ MailService.sendOtp()\n(Nodemailer + Handlebars)"]
    Notif -->|type === 'phone'| SMS["📱 SmsService.sendOtp()\n(Exolve SMS API)"]

    Mail --> SMTP[("📧 SMTP Server")]
    SMS --> Exolve[("☁️ MTS Exolve Gateway")]

    style Auth fill:#0284c7,stroke:#38bdf8,color:#fff
    style RMQ fill:#d97706,stroke:#f59e0b,color:#fff
    style Notif fill:#4f46e5,stroke:#6366f1,color:#fff
    style Mail fill:#0d9488,stroke:#14b8a6,color:#fff
    style SMS fill:#0284c7,stroke:#38bdf8,color:#fff
    style SMTP fill:#334155,stroke:#64748b,color:#fff
    style Exolve fill:#334155,stroke:#64748b,color:#fff
```

## Cài đặt

```bash
cp .env.example .env
# Điền các giá trị vào .env
pnpm install
```

## Biến môi trường

| Biến                | Mô tả                                     |
| ------------------- | ----------------------------------------- |
| `NODE_ENV`          | Môi trường (`development` / `production`) |
| `RMQ_URL`           | RabbitMQ connection URL                   |
| `RMQ_QUEUE`         | Tên queue để lắng nghe                    |
| `SMTP_HOST`         | SMTP server host                          |
| `SMTP_PORT`         | SMTP server port                          |
| `SMTP_USERNAME`     | SMTP username                             |
| `SMTP_PASSWORD`     | SMTP password                             |
| `SMTP_FROM_ADDRESS` | Địa chỉ email gửi đi                      |
| `SMTP_SECURE`       | Sử dụng TLS (`true` / `false`)            |
| `EXOLVE_API_KEY`    | API key của Exolve (MTS)                  |
| `EXOLVE_SENDER`     | Số điện thoại / tên người gửi SMS         |

## Chạy service

```bash
# Development (watch mode)
pnpm dev

# Debug
pnpm debug

# Production
pnpm build && pnpm start:prod
```
