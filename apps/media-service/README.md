# 🎬 Tomato Cinema - Media Service

## 1. Tổng quan (Overview)

`media-service` là một microservice viết bằng **Go (Golang 1.24)** trong hệ sinh thái **Tomato Cinema**. Dịch vụ này đóng vai trò là **trung tâm quản lý tài nguyên đa phương tiện (Media Asset Management)**, chịu trách nhiệm lưu trữ, phục vụ và tối ưu hóa các tệp tin hình ảnh, video, poster phim, banner, avatar người dùng,...

### Đặc điểm nổi bật:

- **Ngôn ngữ & Hiệu năng cao:** Viết bằng Go, tận dụng tối đa xử lý I/O không đồng bộ và bộ nhớ nhẹ (lightweight footprint).
- **Kiến trúc kép (Dual Protocol):**
  - **gRPC Server (Port 50059):** Giao tiếp nội bộ giữa các microservices để tải lên (Upload), xóa (Delete), quản lý media.
  - **HTTP Server (Port 4200):** Cung cấp đường dẫn công khai (Public URL) phục vụ người dùng xem hình ảnh trực tiếp với cơ chế cache HTTP.
- **Tương thích chuẩn S3 (S3-Compatible Storage):** Tích hợp AWS SDK v2, hỗ trợ Cloudflare R2, MinIO, hoặc bất kỳ hệ thống lưu trữ tương thích chuẩn S3 nào.
- **Cơ chế Streaming I/O:** Sử dụng `io.Reader` và `io.ReadCloser` để truyền tải dữ liệu, không tải toàn bộ file lớn vào bộ nhớ RAM.

---

## 2. Kiến trúc hệ thống (Architecture)

Dịch vụ được tổ chức theo mô hình **Clean Architecture / Hexagonal Architecture**, phân tách rõ ràng giữa tầng nghiệp vụ cốt lõi và các adapter kỹ thuật bên ngoài:

```
apps/media-service/
├── cmd/
│   └── main.go                     # Khởi tạo DI, chạy đồng thời gRPC & HTTP, xử lý Graceful Shutdown
├── internal/
│   ├── config/                     # Nạp biến môi trường từ .env
│   ├── application/                # Tầng nghiệp vụ (Use Cases & DTOs)
│   │   ├── dto/                    # Data Transfer Objects (Upload, Get, Delete)
│   │   └── usecases/               # UseCase: UploadMedia, GetMedia, DeleteMedia
│   ├── infrastructure/             # Tầng hạ tầng kỹ thuật
│   │   ├── grpc/                   # Cấu hình gRPC server & Interceptors (Logging, TraceID)
│   │   ├── http/                   # HTTP Server (Gin framework) phục vụ xem file
│   │   ├── images/                 # Module xử lý hình ảnh (Resize, WebP - Processor Interface)
│   │   └── storage/                # Storage Interface & Driver Cloudflare R2 / MinIO
│   └── interfaces/                 # Tầng tiếp nhận dữ liệu (Adapters)
│       └── grpc/                   # gRPC Handlers tiếp nhận protobuf request
├── pkg/
│   └── logger/                     # Bộ ghi log nội bộ (Level: debug, info, warn, error, fatal)
└── scripts/
    └── run_dev.sh                  # Script chạy môi trường dev kết hợp live-reload (Air)
```

<p align="center">
  <img src="./assets/media-architecture.png" alt="Media Service Architecture Diagram" width="100%" />
</p>

_Sơ đồ kiến trúc trực quan Media Service theo phong cách nét vẽ (Hand-drawn sketchy style): Phân tầng giao thức kép (HTTP/Gin + gRPC), luồng xử lý Use Cases và tầng hạ tầng lưu trữ S3/MinIO._

---

### Sơ đồ luồng dữ liệu & Vòng đời xử lý (Data Flow & Lifecycle)

<p align="center">
  <img src="./assets/media-dataflow.png" alt="Media Service Data Flow Diagram" width="100%" />
</p>

_Chi tiết 2 luồng xử lý chính theo phong cách nét vẽ (Hand-drawn sketchy style): **Luồng 1 (gRPC Upload)** tối ưu nén WebP và lưu trữ S3 Stream; **Luồng 2 (HTTP Streaming)** phục vụ xem ảnh trực tiếp với nhận diện MIME động và Cache-Control 24h._

---

## 3. Các cổng giao tiếp & Giao thức (Protocols)

### 3.1. gRPC Server (`:50059`)

Được đăng ký thông qua `contracts` protobuf (`github.com/tomatocinema/contracts/gen/go/media/v1`):

- **`Upload(UploadRequest) -> UploadResponse`**:
  - Nhận dữ liệu nhị phân (`Data`), tên file (`FileName`), thư mục phân loại (`Folder`), loại file (`ContentType`).
  - Trả về đường dẫn định danh `Key` (ví dụ: `posters/avatar-123.webp`).
- **Interceptors được tích hợp:**
  1. `RequestLoggerInterceptor`: Tự động đo và ghi nhận thời gian thực thi (latency) cho từng RPC call.
  2. `TraceIDInterceptor`: Đọc `x-trace-id` từ metadata hoặc tự động sinh UUID mới để gắn vào context.

### 3.2. HTTP Server (`:4200`)

Sử dụng **Gin framework** để phục vụ việc truy xuất dữ liệu tĩnh:

- **Endpoint:** `GET /*key`
- **Cơ chế xử lý:**
  1. Đọc stream từ S3 qua key truyền vào.
  2. Tự động nhận diện MIME type thực tế bằng thư viện `mimetype`.
  3. Gắn header `Cache-Control: public, max-age=86400` (cache 24 giờ trên trình duyệt/CDN).
  4. Trả về dữ liệu ảnh trực tiếp.

---

## 4. Cơ chế lưu trữ (Storage Layer)

Module lưu trữ nằm tại `internal/infrastructure/storage/`:

- **Interface `Storage`:** Thiết kế trừu tượng cho phép dễ dàng thay thế sang Local File System, Google Cloud Storage mà không ảnh hưởng tầng nghiệp vụ:
  ```go
  type Storage interface {
      UploadStream(ctx context.Context, key string, reader io.Reader, contentType string) error
      GetStream(ctx context.Context, key string) (io.ReadCloser, string, error)
      Delete(ctx context.Context, key string) error
      Close() error
  }
  ```
- **Triển khai `S3Storage`:**
  - Hỗ trợ **Path-Style Endpoint** (`o.UsePathStyle = true`), giúp tương thích 100% với MinIO chạy local trên Docker.
  - Tự động kiểm tra (`HeadBucket`) và khởi tạo Bucket (`CreateBucket`) khi dịch vụ khởi động nếu bucket chưa tồn tại.
  - Hỗ trợ tạo **Presigned URL** (`GetPresignedURL`) cho cả phương thức `GET` và `PUT`.

---

## 5. Cấu hình biến môi trường (Environment Variables)

Dịch vụ đọc cấu hình từ file `.env` (tham khảo [.env.example](file:///home/tomato/ssd/data/Projects/tomato_cinema/apps/media-service/.env.example)):

| Biến môi trường | Mặc định         | Mô tả                                                           |
| --------------- | ---------------- | --------------------------------------------------------------- |
| `APP_ENV`       | `development`    | Môi trường chạy (`development` hoặc `production`)               |
| `HTTP_PORT`     | `4200`           | Cổng HTTP Server phục vụ file trực tiếp                         |
| `HTTP_HOST`     | `localhost:4200` | Hostname của HTTP Server để sinh public link                    |
| `GRPC_PORT`        | `50059`          | Cổng tiếp nhận các cuộc gọi gRPC nội bộ                         |
| `GRPC_HOST`        | `localhost`      | Hostname lắng nghe gRPC                                         |
| `GRPC_MAX_MSG_MB`  | `16`             | Kích thước tối đa của tin nhắn gRPC (MB, mặc định 16MB)         |
| `S3_DRIVER`        | `s3`             | Trình điều khiển lưu trữ                                        |
| `S3_BUCKET`        | _(Bắt buộc)_     | Tên bucket (ví dụ: `tomato-cinema-media`)                       |
| `S3_REGION`        | `auto`           | Khu vực S3 (`auto` cho Cloudflare R2, `us-east-1` cho AWS)      |
| `S3_ENDPOINT`      | _(Tùy chọn)_     | Endpoint S3 tùy biến (ví dụ `https://<accountid>.r2.cloudflarestorage.com`) |
| `S3_ACCESS_KEY`    | _(Bắt buộc)_     | Access Key kết nối S3 / Cloudflare R2                           |
| `S3_SECRET_KEY`    | _(Bắt buộc)_     | Secret Key kết nối S3 / Cloudflare R2                           |
| `S3_PUBLIC_URL`    | _(Tùy chọn)_     | URL CDN hoặc Domain công khai của S3                            |
| `LOG_LEVEL`        | `info`           | Mức độ ghi log (`debug`, `info`, `warn`, `error`, `fatal`)      |

---

## 6. Triển khai với Docker & Docker Compose (Containerization)

Dịch vụ đã được đóng gói hoàn chỉnh bằng **Multi-Stage Build** kết hợp image nền **Distroless**:

- **Dockerfile:** `docker/media.Dockerfile`
- **Runner Base:** `gcr.io/distroless/static-debian12:nonroot` (~25-30MB, siêu nhẹ, bảo mật cao, có sẵn CA Certificates chuẩn HTTPS).
- **Healthcheck CLI:** Tích hợp sẵn lệnh nhị phân `media-service healthcheck` gọi giao thức chuẩn `grpc.health.v1.Health/Check`.

### Chạy qua Docker Compose:

```bash
# 1. Khởi động toàn bộ hệ thống hoặc riêng media-service
cd docker && docker compose up -d media-service

# 2. Kiểm tra trạng thái và logs
docker compose ps media-service
docker compose logs -f media-service

# 3. Kiểm tra healthcheck thủ công bên trong container
docker exec media_service_tomato_cinema /media-service healthcheck
```

---

## 7. Phân tích hiện trạng mã nguồn & Đánh giá (Current State Assessment)

### 7.1. Điểm mạnh (Strengths)

- **Kiến trúc chuẩn Clean Architecture:** Phân tách rõ ràng giữa DTO, UseCase, Storage Adapter và Handler.
- **Xử lý Stream tối ưu:** Upload và Download đều dùng `io.Reader`/`io.ReadCloser`, tránh tình trạng tràn RAM (Out of Memory) khi xử lý file media lớn.
- **Quản lý vòng đời tốt (Graceful Shutdown):** Bắt các tín hiệu `SIGINT` / `SIGTERM` và đóng an toàn cả gRPC server, HTTP server và Storage connection với timeout 10 giây (ngay khi hoàn tất sẽ thoát ngay lập tức, không bị giữ block thời gian chờ).
- **Tương thích Cloudflare R2 & MinIO cao:** Code hỗ trợ cờ `UsePathStyle`, cơ chế retry HeadBucket và tự động nhận diện Region `auto`.
- **Đóng gói container tối ưu:** Multi-stage build bằng Go 1.24 và Distroless runner siêu nhẹ (~28MB).

---

## 8. Hướng dẫn chạy và phát triển cục bộ (Development)

### Yêu cầu tiên quyết:

- Go phiên bản **1.24+**
- Hệ thống Storage (Cloudflare R2 hoặc MinIO)

### Các lệnh thực thi:

```bash
# 1. Di chuyển vào thư mục media-service
cd apps/media-service

# 2. Cài đặt các thư viện Go
go mod download

# 3. Tạo file cấu hình từ file mẫu
cp .env.example .env

# 4. Chạy chế độ development (sử dụng script hoặc Air)
./scripts/run_dev.sh
# Hoặc chạy trực tiếp:
go run cmd/main.go
```
