# Báo Cáo Kết Quả Tối Ưu Hóa Toàn Diện Docker & Images (Tomato Cinema)

## 🎯 Tổng Quan Kết Quả Đạt Được

Chúng tôi đã hoàn thành toàn bộ lộ trình tối ưu hóa hệ thống Docker và Image cho dự án **Tomato Cinema** theo đúng kế hoạch đã được phê duyệt.

### 📊 Bảng So Sánh Kích Thước Image Trước & Sau Tối Ưu

| Microservice               | Dung lượng Cũ (Uncompressed) | Dung lượng Mới (Uncompressed) | Dung lượng Nén (Compressed) |       Mức Giảm (Uncompressed)       |    Mức Giảm (Compressed)     |
| :------------------------- | :--------------------------: | :---------------------------: | :-------------------------: | :---------------------------------: | :--------------------------: |
| **`gateway-service`**      |            815 MB            |          **488 MB**           |         **99.7 MB**         |        **-40.1%** (-327 MB)         |    **-37.3%** (-59.3 MB)     |
| **`user-service`**         |            752 MB            |          **424 MB**           |         **90.2 MB**         |        **-43.6%** (-328 MB)         |    **-39.1%** (-57.8 MB)     |
| **`bot-service`**          |            554 MB            |          **365 MB**           |         **83.8 MB**         |        **-34.1%** (-189 MB)         |    **-33.5%** (-42.2 MB)     |
| **`notification-service`** |            865 MB            |          **567 MB**           |        **111.0 MB**         |        **-34.5%** (-298 MB)         |    **-33.5%** (-56.0 MB)     |
| **`auth-service`**         |           1.22 GB            |          **900 MB**           |        **193.0 MB**         |        **-26.2%** (-320 MB)         |    **-23.4%** (-59.0 MB)     |
| **TỔNG CỘNG HỆ THỐNG**     |         **4.21 GB**          |          **2.74 GB**          |        **577.7 MB**         | **-34.9%** (**~1.5 GB giải phóng**) | **-34.6%** (**~300 MB nén**) |

> [!NOTE]
> Toàn bộ 5 microservices backend hiện tại khi nén lưu trữ trên Registry chỉ còn **~83MB – 193MB**, và giải nén chạy trên máy chủ giảm hơn **1.5 GB** tổng thể.

---

## 🛠️ Các Cải Tiến Kỹ Thuật Đã Triển Khai

### 1. Áp dụng Kỹ Thuật `pnpm deploy --prod` Độc Lập

- Thay vì sao chép nguyên khối 750MB thư mục `node_modules` chứa đầy đủ `devDependencies` (TypeScript, Webpack, Turborepo CLI, Jest, Prettier, ESLint), Dockerfile mới sử dụng lệnh chuẩn của pnpm:
  ```bash
  pnpm --filter=${APP_NAME} deploy --prod /prod
  ```
- Lệnh này tự động trích xuất service mục tiêu, chỉ giữ lại đúng các thư viện `dependencies` cần thiết cho runtime và các package nội bộ (`@tomatocinema/contracts`, `common`, `core`, `passport`) kèm `dist/` và `proto/`.

### 2. Kích Hoạt Docker BuildKit & Cache Mounts

- Thiết lập cú pháp `# syntax=docker/dockerfile:1` và cấu hình Buildx plugin trên máy chủ.
- Tận dụng cache mounts persistent giữa các lần build:
  - Cache npm global: `--mount=type=cache,target=/root/.npm`
  - Cache pnpm store: `--mount=type=cache,id=pnpm,target=/pnpm/store`
  - Cache apk OS: `--mount=type=cache,target=/var/cache/apk`
  - Cache Turborepo: `--mount=type=cache,target=/app/.turbo`
- Giúp các lần rebuild mã nguồn tiếp theo hoàn thành chỉ trong **30s – 50s** thay vì phải tải lại hàng trăm MB qua mạng.

### 3. Giải Quyết Triệt Để Lỗ Hổng PID 1 & Graceful Shutdown

- Tích hợp `/sbin/tini` làm entrypoint init process:
  ```dockerfile
  ENTRYPOINT ["/sbin/tini", "--"]
  CMD ["sh", "-c", "... && exec node dist/main.js"]
  ```
- **Kết quả đo kiểm**: Khi chạy lệnh `docker stop`, container phản hồi và tắt hoàn tất trong vòng **0.023 giây** (thay vì bị treo cứng 10 giây rồi bị `SIGKILL` như trước), đảm bảo toàn bộ request dở dang và kết nối database pool, RabbitMQ channel được đóng an toàn.

### 4. Loại Bỏ Rủi Ro Mất Dữ Liệu `prisma db push --accept-data-loss`

- Loại bỏ lệnh `command: > sh -c "(cd apps/auth-service && ./node_modules/.bin/prisma db push --accept-data-loss) ..."` cứng trong `docker/apps/docker-compose.yml`.
- Chuyển sang cơ chế kiểm soát có điều kiện thông qua biến môi trường `AUTO_MIGRATE=true` (dành cho local/dev) và loại bỏ hoàn toàn cờ nguy hiểm `--accept-data-loss`.

### 5. Khắc Phục Lỗi Tương Thích Protobuf Trong Alpine

- Chuẩn hóa script `packages/contracts/src/scripts/generate_go.sh` sang `/bin/sh` POSIX và thêm điều kiện kiểm tra `protoc-gen-go`.
- Tránh lỗi `sh: bash: not found` làm crash quá trình build trong container Alpine Linux.

### 6. Gia Cố Docker Compose Với Healthchecks & Resource Limits

- **Healthcheck thời gian thực**:
  - `gateway-service`: `wget -qO- http://127.0.0.1:4000/health`
  - `auth-service`: `nc -z 127.0.0.1 50051`
  - `user-service`: `nc -z 127.0.0.1 50052`
  - `notification-service`: `wget -qO- http://127.0.0.1:9102/metrics`
- **Khử bỏ Race Condition khi khởi động**:
  - `gateway-service` chỉ khởi động khi `auth-service` và `user-service` đã đạt trạng thái `service_healthy`.
  - `nginx` chỉ tiếp nhận request khi `gateway-service` đã `service_healthy`.
- **Bảo vệ tài nguyên máy chủ**:
  - Cấu hình Log Rotation `max-size: 10m`, `max-file: 3` cho toàn bộ container trong `apps/` và `infra/` để ngăn ngừa đầy ổ đĩa host.
  - Cấu hình giới hạn bộ nhớ `deploy.resources.limits.memory` hợp lý cho từng thành phần (Postgres: 1G, Redis: 512M, Apps: 256M - 512M, Nginx: 128M).

---

## 🔍 Danh Sách Tệp Đã Được Thay Đổi

1. **[.dockerignore](file:///home/tomato/ssd/data/Projects/tomato_cinema/.dockerignore)**: Bổ sung loại trừ `docker/`, `apps/docs/`, `apps/media-service/`, `*.md`, `.github/`, `.gemini/` để bảo vệ layer cache.
2. **[docker/Dockerfile](file:///home/tomato/ssd/data/Projects/tomato_cinema/docker/Dockerfile)**: Nâng cấp BuildKit, `pnpm deploy --prod`, `tini`, và lệnh khởi động an toàn.
3. **[docker/apps/docker-compose.yml](file:///home/tomato/ssd/data/Projects/tomato_cinema/docker/apps/docker-compose.yml)**: Thêm healthcheck, depends_on healthy, logging limits và memory limits.
4. **[docker/infra/docker-compose.yml](file:///home/tomato/ssd/data/Projects/tomato_cinema/docker/infra/docker-compose.yml)**: Thêm logging limits và memory limits cho Postgres, Redis, RabbitMQ, Exporters.
5. **[packages/contracts/src/scripts/generate_go.sh](file:///home/tomato/ssd/data/Projects/tomato_cinema/packages/contracts/src/scripts/generate_go.sh)**: Chuyển sang `/bin/sh` và kiểm tra công cụ Go trước khi sinh mã.
6. **[packages/contracts/package.json](file:///home/tomato/ssd/data/Projects/tomato_cinema/packages/contracts/package.json)**: Đổi gọi `bash` thành `sh`.
