# gateway-service

API Gateway của hệ thống **Tomato Cinema** — điểm tiếp nhận toàn bộ yêu cầu từ client.

## Chức năng

- Nhận HTTP REST requests từ client và web app
- Định tuyến tới các microservices nội bộ qua **gRPC** và **RabbitMQ**
- Xử lý xác thực JWT (authentication guard)
- Swagger API documentation
- Cookie-based session management

## Tech Stack

- **NestJS** — Framework chính
- **gRPC** — Giao tiếp nội bộ với auth-service
- **RabbitMQ** — Gửi sự kiện tới các services
- **Swagger** — Tự động sinh API documentation
- **`@tomatocinema/passport`** — JWT guard & strategy
- **`@tomatocinema/contracts`** — Shared types & Protobuf definitions

## Cài đặt

```bash
cp .env.example .env
# Điền các giá trị vào .env
pnpm install
```

## Biến môi trường

| Biến | Mô tả |
|------|-------|
| `NODE_ENV` | Môi trường chạy (`development` / `production`) |
| `GRPC_HOST` | Host của auth-service gRPC server |
| `GRPC_PORT` | Port của auth-service gRPC server |
| `RMQ_URL` | RabbitMQ connection URL |
| `PASSPORT_SECRET_KEY` | Secret key để verify JWT |
| `PASSPORT_ACCESS_TTL` | TTL access token (giây) |
| `PASSPORT_REFRESH_TTL` | TTL refresh token (giây) |

## Chạy service

```bash
# Development (watch mode)
pnpm dev

# Debug
pnpm debug

# Production
pnpm build && pnpm start:prod
```

## API Documentation

Sau khi chạy service, truy cập Swagger UI tại:

```
http://localhost:<PORT>/api
```
