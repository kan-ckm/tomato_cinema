# 📚 Tomato Cinema Documentation

Hệ thống trang web tài liệu kỹ thuật của dự án **Tomato Cinema**, xây dựng trên nền tảng **Next.js (App Router)** và **Fumadocs**.

## 🚀 Khởi chạy dự án

Từ thư mục gốc của repository (`tomato_cinema`):

```bash
# Chạy riêng trang docs
pnpm --filter docs dev

# Hoặc khởi chạy từ thư mục apps/docs
cd apps/docs
pnpm dev
```

Truy cập: `http://localhost:3501/docs` (hoặc cổng cấu hình).

## 🛠️ Build Production

```bash
pnpm --filter docs build
```

Hệ thống tự động biên dịch toàn bộ tài liệu thành **Static Site Generation (SSG)** với tốc độ tải trang cực nhanh và tự động sinh chỉ mục tìm kiếm (Orama Search).

## 📁 Cấu trúc tài liệu (`content/docs/`)

- `01-getting-started/`: Cài đặt môi trường, chạy local, docker compose và biến môi trường.
- `02-architecture-macro/`: **Luồng lớn (Macro Flows)** — Toàn cảnh kiến trúc hệ thống, vòng đời xác thực (Auth Lifecycle), hành trình mua vé (Booking Journey), xử lý media streaming và hàng đợi sự kiện RabbitMQ.
- `03-services/`: Chi tiết từng microservice (`gateway-service`, `auth-service`, `user-service`, `media-service`, `notification-service`, `bot-service`).
- `04-micro-flows/`: **Luồng nhỏ (Micro Flows)** — Giải pháp kỹ thuật sâu: Redis Distributed Lock, Token Rotation & Reuse Detection, Webhook Idempotency & Retry, Chunked Upload Resumption.
- `05-api-reference/`: Quy chuẩn REST API và cấu trúc sự kiện Message Queue.

## 📊 Sơ đồ Mermaid trong MDX

Bạn có thể chèn trực tiếp sơ đồ kiến trúc Mermaid vào bất kỳ file `.mdx` nào:

```mdx
<Mermaid
  caption="Mô tả sơ đồ"
  chart={`
flowchart TD
    Client --> Gateway
    Gateway --> ServiceA
    Gateway --> ServiceB
`}
/>
```

Hỗ trợ đầy đủ: `flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `erDiagram`, `classDiagram`.
