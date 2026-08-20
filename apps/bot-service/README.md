# bot-service

Telegram Bot tích hợp cho hệ thống **Tomato Cinema**.

## Chức năng

- Xử lý Telegram OAuth callback
- Giao tiếp với auth-service qua gRPC
- Tương tác với người dùng qua Telegram

## Tech Stack

- **TypeScript** — Ngôn ngữ chính
- **Telegraf** — Telegram Bot framework
- **gRPC (`@grpc/grpc-js`)** — Giao tiếp nội bộ
- **`@tomatocinema/contracts`** — Shared Protobuf types

## Chạy

```bash
# Development (watch mode)
pnpm dev

# Production
pnpm build && pnpm start
```
