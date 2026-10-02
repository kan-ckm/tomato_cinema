# 🍅 Tomato Cinema — Microservices Architecture

<p align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NestJS-Dark.svg" width="45" height="45" alt="NestJS" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Golang.svg" width="45" height="45" alt="Golang" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Dark.svg" width="45" height="45" alt="NextJS" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/TypeScript.svg" width="45" height="45" alt="TypeScript" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/PostgreSQL-Dark.svg" width="45" height="45" alt="PostgreSQL" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Redis-Dark.svg" width="45" height="45" alt="Redis" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/RabbitMQ-Dark.svg" width="45" height="45" alt="RabbitMQ" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Docker.svg" width="45" height="45" alt="Docker" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Nginx.svg" width="45" height="45" alt="Nginx" />
</p>

<p align="center">
  <b>Hệ thống xem phim trực tuyến xây dựng theo kiến trúc Microservices phân tán với gRPC, Event-Driven, Golang Media Service và Monorepo.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Author-tomato%20(Solo)-red?style=for-the-badge&logo=github" alt="Author tomato" />
  <img src="https://img.shields.io/badge/Project%20Type-Personal%20Research%20%26%20Showcase-informational?style=for-the-badge&logo=googlescholar" alt="Personal Research Project" />
  <img src="https://img.shields.io/badge/Architecture-Microservices%20%7C%20gRPC%20%7C%20Event--Driven-blue?style=for-the-badge" alt="Architecture" />
  <img src="https://img.shields.io/badge/Stack-TypeScript%20%7C%20Go%201.24-green?style=for-the-badge" alt="Stack" />
</p>

---

> [!NOTE]
>
> ### 🎓 LỜI MỞ ĐẦU & MỤC ĐÍCH DỰ ÁN
>
> **Tomato Cinema** là dự án cá nhân do **tomato** độc lập nghiên cứu, thiết kế và phát triển. Dự án được xây dựng với mục tiêu thực hành và làm chủ các mô hình thiết kế hệ thống thực tế (System Design), chuyển dịch từ tư duy Monolith truyền thống sang hệ sinh thái **Microservices phân tán**, đa ngôn ngữ (**TypeScript + Golang**), giao tiếp tốc độ cao qua **gRPC**, xử lý bất đồng bộ qua **RabbitMQ**, và quản lý thống nhất dưới dạng **Monorepo**.

---

## 📌 Mục lục

- [1. Giới thiệu dự án & Kiến trúc tổng thể](#1-giới-thiệu-dự-án--kiến-trúc-tổng-thể)
- [2. Cấu trúc Monorepo & Danh mục dịch vụ](#2-cấu-trúc-monorepo--danh-mục-dịch-vụ)
- [3. Bảng công nghệ sử dụng](#3-bảng-công-nghệ-sử-dụng)
- [4. Những điểm nổi bật về mặt kỹ thuật](#4-những-điểm-nổi-bật-về-mặt-kỹ-thuật)
- [5. Hướng dẫn cài đặt và khởi chạy từ A - Z](#5-hướng-dẫn-cài-đặt-và-khởi-chạy-từ-a---z)
  - [Bước 1: Chuẩn bị môi trường](#bước-1-chuẩn-bị-môi-trường)
  - [Bước 2: Clone repository & Cài đặt dependencies](#bước-2-clone-repository--cài-đặt-dependencies)
  - [Bước 3: Khởi động hạ tầng với Docker (Database, Cache, Message Broker)](#bước-3-khởi-động-hạ-tầng-với-docker-database-cache-message-broker)
  - [Bước 4: Cấu hình biến môi trường (.env)](#bước-4-cấu-hình-biến-môi-trường-env)
  - [Bước 5: Biên dịch Protobuf Contracts (gRPC)](#bước-5-biên-dịch-protobuf-contracts-grpc)
  - [Bước 6: Đồng bộ cơ sở dữ liệu (Database Migration)](#bước-6-đồng-bộ-cơ-sở-dữ-liệu-database-migration)
  - [Bước 7: Khởi động toàn bộ dự án](#bước-7-khởi-động-toàn-bộ-dự-án)
  - [Bảng tra cứu cổng & địa chỉ truy cập](#bảng-tra-cứu-cổng--địa-chỉ-truy-cập)
- [6. Tác giả & Đóng góp](#6-tác-giả--đóng-góp)

---

## 1. Giới thiệu dự án & Kiến trúc tổng thể

Ý tưởng của dự án là mô phỏng một nền tảng giải trí xem phim trực tuyến (**Tomato Cinema**), chia tách hệ thống thành các service độc lập để giải quyết triệt để các bài toán lớn của hệ thống phân tán:

- **Giao tiếp nội bộ độ trễ thấp (Low-latency IPC):** Dùng **gRPC (HTTP/2 + Protocol Buffers)** thay vì REST HTTP/1.1 truyền thống trong mạng nội bộ, tối ưu hóa payload dạng nhị phân và chuẩn hóa hợp đồng dữ liệu (Contracts).
- **Kiến trúc hướng sự kiện (Event-Driven):** Sử dụng **RabbitMQ** để xử lý các luồng công việc ngầm, tốn thời gian (gửi email xác thực OTP, thông báo hệ thống) mà không làm chậm trải nghiệm người dùng trên API chính.
- **Xử lý đa phương tiện hiệu năng cao (High-performance Media Processing):** Microservice xử lý hình ảnh và truyền phát media được viết bằng **Golang**, tích hợp lưu trữ tương thích chuẩn S3 (AWS S3, MinIO, Cloudflare R2), hỗ trợ tối ưu ảnh WebP và Streaming I/O không chiếm dụng RAM.
- **Mô hình Database-per-Service:** Các domain khác nhau sở hữu cơ sở dữ liệu riêng biệt trên PostgreSQL (Auth DB, Users DB), đảm bảo tính cô lập và khả năng mở rộng độc lập.
- **Bảo mật & Phiên làm việc (Auth & Identity):** Đăng nhập Passwordless thông qua OTP Email hoặc liên kết Telegram Bot SSO 1-chạm, quản lý phiên qua Access Token và Refresh Token Rotation đặt trong HttpOnly Cookie bảo vệ chống tấn công XSS/CSRF.

### Sơ đồ kiến trúc hệ thống

<p align="center">
  <img src="./assets/architecture.png" alt="Tomato Cinema Architecture Diagram" width="100%" />
</p>

_Mô hình luồng phân tầng: **Clients** (Web / Bot) ➔ **Edge Nginx Proxy** ➔ **API Gateway** (REST API / Auth Guard) ➔ **Microservices** (gRPC nội bộ) ➔ **RabbitMQ** (Message Queue) ➔ **Storage & Cache** (PostgreSQL, Redis, S3/MinIO)._

---

## 2. Cấu trúc Monorepo & Danh mục dịch vụ

Hệ thống được tổ chức theo cấu trúc **Turborepo Monorepo** với trình quản lý gói **pnpm workspace**:

```text
tomato_cinema/
├── apps/
│   ├── gateway-service/     # API Gateway chính: Đón REST API, xác thực, Rate Limiting, route gRPC
│   ├── auth-service/        # Identity Service: Xử lý OTP, Telegram SSO, cấp phát & xoay JWT (Prisma)
│   ├── user-service/        # User Service: Quản lý hồ sơ cá nhân, phân quyền người dùng (TypeORM)
│   ├── media-service/       # Media Service (Go 1.24): Quản lý tài nguyên media, S3/MinIO, WebP conversion
│   ├── notification-service/# Worker dịch vụ thông báo: Lắng nghe RabbitMQ gửi email OTP qua Mailer
│   ├── bot-service/         # Telegram Bot Service: Xử lý tương tác Telegram và luồng xác minh danh tính
│   ├── web/                 # Giao diện người dùng Web Client (Next.js 16 + React 19)
│   └── docs/                # Trang web tài liệu kỹ thuật & sơ đồ tương tác (Archify Diagrams)
│
├── packages/
│   ├── contracts/           # Chứa file .proto và kịch bản biên dịch mã nguồn (ts-proto & Go protobuf)
│   ├── common/              # Module dùng chung: GrpcModule động, Custom Decorators, Filter, Interceptors
│   ├── passport/            # Thư viện cấu hình chiến lược xác thực JWT & Guards
│   ├── core/                # Định nghĩa các Data Transfer Objects (DTO), Enums, kiểu dữ liệu chia sẻ
│   ├── ui/                  # Thư viện thành phần giao diện React dùng chung
│   ├── eslint-config/       # Bộ quy tắc lint chuẩn mực áp dụng toàn bộ dự án
│   └── typescript-config/   # Cấu hình tsconfig nền tảng cho monorepo
│
├── docker/
│   ├── infra/               # Docker Compose cho PostgreSQL, Redis, RabbitMQ (+ Exporters)
│   ├── apps/                # Docker Compose chạy toàn bộ 5 microservices backend
│   ├── nginx/               # Reverse Proxy & Edge Rate Limiter cấu hình Nginx
│   ├── observability/       # Cụm giám sát OpenTelemetry & Prometheus
│   └── Dockerfile           # Dockerfile Multi-stage đa năng dùng chung cho mọi service
│
├── turbo.json               # Quy định pipeline build, dev, cache thông minh của Turborepo
├── package.json             # Root package script
└── pnpm-workspace.yaml      # Khai báo các workspace thành viên
```

---

## 3. Bảng công nghệ sử dụng

| Phân vùng                 | Công nghệ                      | Vai trò trong hệ sinh thái                                                  |
| :------------------------ | :----------------------------- | :-------------------------------------------------------------------------- |
| **Ngôn ngữ**              | TypeScript, Go (Golang 1.24)   | TypeScript type-safe toàn diện; Golang cho tác vụ I/O media tốc độ cao      |
| **Backend Framework**     | NestJS 11, Gin (Go)            | NestJS module hóa mạnh mẽ; Gin framework siêu nhẹ phục vụ HTTP media stream |
| **IPC (Liên dịch vụ)**    | gRPC, Protocol Buffers         | Giao tiếp nhị phân nội bộ, schema rõ ràng, độ trễ cực thấp                  |
| **Event Broker**          | RabbitMQ (AMQP)                | Xử lý hàng đợi phi đồng bộ, gửi email OTP và thông báo hệ thống             |
| **Cơ sở dữ liệu**         | PostgreSQL 16                  | Hệ quản trị CSDL quan hệ chính (tách biệt database `auth` và `users`)       |
| **Bộ nhớ đệm (Cache)**    | Redis 8                        | Lưu trữ phiên làm việc, chống spam gửi mã OTP, Blacklist/Whitelist Token    |
| **Lưu trữ tệp (Storage)** | S3-Compatible (MinIO / AWS S3) | Lưu trữ posters, avatars, videos với cơ chế Streaming I/O                   |
| **ORM**                   | Prisma, TypeORM                | Thực hành cả Prisma ORM (`auth-service`) và TypeORM (`user-service`)        |
| **Frontend**              | Next.js 16, React 19           | Trải nghiệm giao diện xem phim hiện đại, Server Components                  |
| **Tài liệu & Sơ đồ**      | Fumadocs, Archify Diagrams     | Tài liệu hóa kiến trúc tương tác, xem sơ đồ động đa chế độ                  |
| **Monorepo & Build**      | Turborepo, pnpm                | Cache tác vụ build, tối ưu hóa thời gian triển khai và chia sẻ mã nguồn     |
| **DevOps & Container**    | Docker, Docker Compose, Nginx  | Đóng gói môi trường đồng nhất, Nginx Gateway Proxy và Rate Limiting         |

---

## 4. Những điểm nổi bật về mặt kỹ thuật

- [x] **Tự xây dựng `AbstractGrpcClient` & Dynamic `GrpcModule`:**
  - Đóng gói logic kết nối gRPC, tự động chuyển đổi `Observable` (RxJS) thành `Promise` native, giúp code tại Controller/Service viết bằng cú pháp `async/await` rõ ràng, tự nhiên.
  - Xây dựng module động đăng ký linh hoạt các package gRPC (`AUTH_PACKAGE`, `ACCOUNT_PACKAGE`, `USERS_PACKAGE`, `MEDIA_PACKAGE`) qua decorator tùy chỉnh `@InjectGrpcClient()`.
- [x] **Luồng xác thực Passwordless OTP & Telegram SSO an toàn:**
  - Quy trình đăng nhập không cần mật khẩu: Nhập Email ➔ Nhận OTP từ worker RabbitMQ ➔ Xác thực OTP.
  - Hỗ trợ đăng nhập Telegram một chạm thông qua xác minh chữ ký mã hóa từ Telegram Bot.
  - Cấp phát Access Token (lưu bộ nhớ tạm) và Refresh Token tự xoay vòng (Refresh Token Rotation) được bảo quản an toàn trong HttpOnly Cookie nhằm triệt tiêu nguy cơ bị đánh cắp qua XSS.
- [x] **Media Service độc lập bằng Golang (Clean Architecture):**
  - Cấu trúc theo kiến trúc sạch (Domain, UseCases, Infrastructure, Interfaces).
  - Tích hợp chuẩn lưu trữ S3 qua AWS SDK Go v2, hỗ trợ truyền phát qua `io.Reader`/`io.ReadCloser` không làm tràn bộ nhớ khi xử lý file lớn.
  - Bộ nén và chuyển đổi định dạng ảnh tối ưu sang WebP tự động.
- [x] **Event-Driven Architecture với RabbitMQ:**
  - Tách rời các luồng gửi email xác nhận và thông báo hệ thống ra khỏi vòng đời request chính của người dùng, đảm bảo API Gateway phản hồi tức thì.
- [x] **Hợp đồng dữ liệu tập trung (Protobuf Contracts):**
  - Quản lý tập trung các tệp `.proto` tại `packages/contracts`, tự động sinh mã nguồn TypeScript (`ts-proto`) và Go (`protoc-gen-go`) đồng bộ khi có thay đổi interface.

---

## 5. Hướng dẫn cài đặt và khởi chạy từ A - Z

Dưới đây là các bước chi tiết để thiết lập và chạy toàn bộ hệ thống trên máy tính của bạn.

### Bước 1: Chuẩn bị môi trường

Hãy chắc chắn rằng máy tính của bạn đã cài đặt các công cụ sau:

- **Node.js**: Phiên bản 18 trở lên (Khuyên dùng **Node 20 LTS**).
- **pnpm**: Phiên bản 9 trở lên (`npm install -g pnpm`).
- **Docker & Docker Compose**: Để khởi chạy PostgreSQL, Redis, RabbitMQ.
- **Go** _(tùy chọn)_: Phiên bản 1.24 trở lên nếu bạn muốn chạy `media-service` trực tiếp trên máy host.

---

### Bước 2: Clone repository & Cài đặt dependencies

```bash
# Clone repository về máy
git clone https://github.com/kan-ckm/tomato_cinema.git
cd tomato_cinema

# Cài đặt toàn bộ dependencies cho các app và package trong monorepo
pnpm install
```

---

### Bước 3: Khởi động hạ tầng với Docker (Database, Cache, Message Broker)

Dự án đã chuẩn bị sẵn cấu hình Docker Compose dành riêng cho hạ tầng trong thư mục `docker/infra/`:

```bash
cd docker/infra

# Tạo file .env cho hạ tầng từ mẫu có sẵn
cp .env.example .env

# Khởi động PostgreSQL, Redis và RabbitMQ chạy ngầm
docker compose up -d

# Kiểm tra trạng thái các container
docker compose ps

# Quay về thư mục gốc của dự án
cd ../..
```

> **Lưu ý:** Script `docker/infra/init-db/01-init-databases.sh` sẽ tự động tạo sẵn 2 cơ sở dữ liệu `auth` và `users` trong container PostgreSQL khi khởi tạo lần đầu.

---

### Bước 4: Cấu hình biến môi trường (`.env`)

Tạo các file `.env` từ file mẫu `.env.example` tại từng dịch vụ:

```bash
# 1. API Gateway
cp apps/gateway-service/.env.example apps/gateway-service/.env

# 2. Auth Service
cp apps/auth-service/.env.example apps/auth-service/.env

# 3. User Service
cp apps/user-service/.env.example apps/user-service/.env

# 4. Media Service
cp apps/media-service/.env.example apps/media-service/.env

# 5. Notification Service
cp apps/notification-service/.env.example apps/notification-service/.env

# 6. Telegram Bot Service
cp apps/bot-service/.env.example apps/bot-service/.env
```

_Điền các thông tin kết nối tương ứng (mật khẩu Postgres/Redis/RabbitMQ bạn đã đặt ở bước 3, mã Bot Token Telegram, tài khoản SMTP gửi mail nếu muốn test gửi OTP thật)._

---

### Bước 5: Biên dịch Protobuf Contracts (gRPC)

Trước khi chạy các service backend, hãy sinh mã nguồn TypeScript và Go từ các định nghĩa Protobuf:

```bash
pnpm --filter @tomatocinema/contracts build
```

---

### Bước 6: Đồng bộ cơ sở dữ liệu (Database Migration)

Đồng bộ lược đồ cơ sở dữ liệu cho `auth-service` (sử dụng Prisma):

```bash
pnpm --filter auth-service exec prisma db push
```

_Đối với `user-service`, TypeORM đã được cấu hình tự động đồng bộ thực thể (synchronize) trong môi trường development._

---

### Bước 7: Khởi động toàn bộ dự án

#### Lựa chọn A: Chế độ Hybrid Development (Khuyên dùng khi lập trình)

Hạ tầng (Postgres, Redis, RabbitMQ) chạy trên Docker, còn mã nguồn các service chạy trực tiếp trên máy host để tận dụng tính năng Hot-Reload tức thì của Turborepo:

```bash
# Khởi động tất cả các ứng dụng Node.js (Gateway, Auth, User, Notification, Bot, Web, Docs)
pnpm dev
```

Nếu muốn khởi động dịch vụ **Media Service** (Golang):

```bash
# Mở một terminal mới:
cd apps/media-service
go run cmd/main.go
# Hoặc sử dụng Air để có live-reload (nếu đã cài air):
./scripts/run_dev.sh
```

Hoặc nếu bạn chỉ muốn khởi động riêng một service cụ thể:

```bash
# Chỉ chạy API Gateway:
pnpm --filter gateway-service dev

# Chỉ chạy Auth Service:
pnpm --filter auth-service dev

# Chỉ chạy User Service:
pnpm --filter user-service dev

# Chỉ chạy Frontend Web:
pnpm --filter web dev
```

---

#### Lựa chọn B: Chạy toàn bộ hệ thống bằng Docker Compose

Nếu bạn muốn chạy thử nghiệm đầy đủ môi trường container hóa (End-to-End Test):

```bash
cd docker

# Tạo các file .env tổng hợp
cp infra/.env.example infra/.env
cp apps/.env.example apps/.env

# Khởi động toàn bộ hệ thống
docker compose up -d --build
```

---

### Bảng tra cứu cổng & địa chỉ truy cập

| Dịch vụ / Công cụ        | Giao thức / Cổng | URL truy cập / Kết nối       | Ghi chú                                   |
| :----------------------- | :--------------- | :--------------------------- | :---------------------------------------- |
| **API Gateway**          | HTTP / `3000`    | `http://localhost:3000`      | Cổng tiếp nhận REST API chính             |
| **Swagger API Docs**     | HTTP / `3000`    | `http://localhost:3000/docs` | Tài liệu tương tác & kiểm thử API         |
| **Web Client**           | HTTP / `3500`    | `http://localhost:3500`      | Giao diện người dùng Next.js              |
| **Documentation**        | HTTP / `3501`    | `http://localhost:3501`      | Trang tài liệu kỹ thuật & sơ đồ Archify   |
| **Media Service (HTTP)** | HTTP / `4200`    | `http://localhost:4200`      | Truyền phát và xem hình ảnh media         |
| **Media Service (gRPC)** | gRPC / `50059`   | `localhost:50059`            | IPC upload/delete tài nguyên media        |
| **Auth Service**         | gRPC / `50051`   | `localhost:50051`            | Dịch vụ xác thực và cấp mã JWT            |
| **User Service**         | gRPC / `50052`   | `localhost:50052`            | Dịch vụ hồ sơ người dùng                  |
| **RabbitMQ Dashboard**   | HTTP / `15673`   | `http://localhost:15673`     | Bảng điều khiển quản trị queue & exchange |
| **PostgreSQL**           | TCP / `5433`     | `localhost:5433`             | Cơ sở dữ liệu quan hệ (`auth`, `users`)   |
| **Redis**                | TCP / `6379`     | `localhost:6379`             | Bộ nhớ đệm phân tán và phiên làm việc     |

---

## 6. Tác giả & Đóng góp

- **Tác giả:** **tomato** (Solo Developer)
- 📌 Dự án được thực hiện với tinh thần độc lập nghiên cứu, học hỏi và trải nghiệm sâu về thiết kế hệ thống lớn.
- Nếu bạn có bất kỳ thắc mắc, phản hồi hoặc ý kiến đóng góp nhằm cải tiến kiến trúc dự án, đừng ngần ngại tạo **Issue** hoặc gửi **Pull Request** trên repository!

Cảm ơn bạn đã quan tâm và theo dõi dự án! ⭐
