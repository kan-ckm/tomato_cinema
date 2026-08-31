# 🐳 Hướng Dẫn Quản Trị & Vận Hành Docker - Tomato Cinema

Tài liệu này cung cấp hướng dẫn chi tiết về cấu trúc, cách cấu hình và quy trình vận hành toàn bộ hệ thống container (Cơ sở hạ tầng & Microservices) cho dự án **Tomato Cinema**.

---

## 📌 1. Cấu Trúc Thư Mục `docker/`

Toàn bộ cấu hình Docker được tổ chức theo mô hình phân tách rõ ràng giữa **hạ tầng** và **ứng dụng**:

```text
docker/
├── infra/                          # 🗄️ Cơ sở hạ tầng (PostgreSQL, Redis, RabbitMQ)
│   ├── docker-compose.yml          #    Điều phối 3 service hạ tầng
│   ├── .env                        #    Biến môi trường hạ tầng (ĐÃ .gitignore)
│   ├── .env.example                #    Mẫu biến môi trường hạ tầng
│   └── init-db/
│       └── 01-init-databases.sh    #    Script tự động tạo DB auth + users khi khởi tạo lần đầu
├── apps/                           # 🚀 Microservices Backend
│   ├── docker-compose.yml          #    Điều phối 5 microservices
│   ├── .env                        #    Biến môi trường app (ĐÃ .gitignore)
│   └── .env.example                #    Mẫu biến môi trường app
├── Dockerfile                      # Dockerfile Multi-Stage đa năng dùng chung cho mọi service
├── docker-compose.yml              # File tổng hợp (include cả infra/ & apps/)
├── .env                            # Biến môi trường master (ĐÃ .gitignore)
├── .env.example                    # Mẫu tham khảo tổng hợp
└── README.md                       # Tài liệu hướng dẫn này
```

---

## ⚙️ 2. Chuẩn Bị Biến Môi Trường (`.env`)

Mỗi thư mục có file `.env` riêng. Tạo từ file mẫu trước khi chạy:

```bash
# --- Hạ tầng ---
cp docker/infra/.env.example docker/infra/.env

# --- Microservices ---
cp docker/apps/.env.example docker/apps/.env
```

**Nội dung cần cấu hình:**

| File | Chứa gì |
| :--- | :--- |
| `infra/.env` | PostgreSQL, Redis, RabbitMQ (user, password, port) |
| `apps/.env` | Kết nối tới infra + JWT, Cookie, Telegram Bot, SMTP |

---

## 🚀 3. Hướng Dẫn Sử Dụng Theo Từng Kịch Bản

### 🎯 Kịch bản 1: Dev Hybrid (Khuyên dùng khi lập trình tính năng mới)
*Chỉ chạy Database, Cache và RabbitMQ trên Docker; còn mã nguồn backend bạn chạy trực tiếp ngoài máy thật với lệnh `pnpm dev` để có Hot-Reload tức thì mà không cần rebuild Docker.*

```bash
# Khởi động riêng hạ tầng
cd docker/infra && docker compose up -d

# Kiểm tra trạng thái hạ tầng
docker compose ps

# Khi muốn dừng hạ tầng
docker compose down
```

---

### 🎯 Kịch bản 2: Chạy toàn bộ hệ thống bằng Docker (Full Stack)
*Dùng khi muốn kiểm thử tích hợp (End-to-End Test), chạy thử nghiệm toàn bộ 8 containers.*

```bash
cd docker

# Khởi động toàn bộ 8 containers (Hạ tầng + 5 Microservices)
docker compose up -d

# Xem log thời gian thực của tất cả service
docker compose logs -f

# Xem log riêng của 1 service cụ thể (ví dụ gateway-service)
docker compose logs -f gateway-service
```

> **💡 Mẹo:** Nếu bạn đứng ở thư mục gốc dự án (Root Monorepo), bạn có thể chạy:
> ```bash
> docker compose -f docker/docker-compose.yml up -d
> ```

---

### 🎯 Kịch bản 3: Build hoặc Rebuild lại một Service cụ thể
*Khi bạn vừa sửa code của một service và muốn đóng gói lại image mới:*

```bash
# 1. Build lại riêng service đó (ví dụ gateway-service)
cd docker/apps && docker compose build gateway-service

# 2. Khởi động lại service vừa build
docker compose up -d gateway-service
```

---

### 🎯 Kịch bản 4: Tắt & Dọn dẹp hệ thống

```bash
cd docker

# 1. Tắt bình thường (GIỮ NGUYÊN dữ liệu Database, Redis, RabbitMQ)
docker compose down

# 2. Tắt và XÓA SẠCH DỮ LIỆU (Reset trắng tinh toàn bộ database & queues)
docker compose down -v
```

---

## 🌐 4. Bảng Cổng Giao Tiếp & Địa Chỉ Truy Cập

| Dịch vụ | Cổng Host (Máy thật) | Cổng Container | Địa chỉ truy cập / Kết nối |
| :--- | :---: | :---: | :--- |
| **API Gateway** | `4000` | `4000` | [http://localhost:4000](http://localhost:4000) |
| **Swagger API Docs** | `4000` | `4000` | [http://localhost:4000/docs](http://localhost:4000/docs) |
| **PostgreSQL** | `5433` | `5432` | `localhost:5433` (DB: `${POSTGRES_DB}`) |
| **Redis** | `6379` | `6379` | `localhost:6379` (Yêu cầu mật khẩu trong `.env`) |
| **RabbitMQ AMQP** | `5673` | `5672` | `amqp://<USER>:<PASS>@localhost:5673` |
| **RabbitMQ Management**| `15673` | `15672` | [http://localhost:15673](http://localhost:15673) |
| **Auth gRPC** | `50051` | `50051` | `localhost:50051` |
| **User gRPC** | `50052` | `50052` | `localhost:50052` |
| **Grafana** | `3001` | `3000` | [http://localhost:3001](http://localhost:3001) |
| **Prometheus** | `9090` | `9090` | [http://localhost:9090](http://localhost:9090) |
| **Tempo (Traces)** | `3200` | `3200` | `localhost:3200` |
| **Loki (Logs)** | `3100` | `3100` | `localhost:3100` |
| **PostgreSQL Exporter**| `9187` | `9187` | [http://localhost:9187/metrics](http://localhost:9187/metrics) |
| **Redis Exporter** | `9121` | `9121` | [http://localhost:9121/metrics](http://localhost:9121/metrics) |
| **RabbitMQ Metrics** | - | `15692` | [http://localhost:15673/metrics](http://localhost:15673/metrics) (nội bộ: 15692) |

---

## 📊 5. Khuyến Nghị Dashboard Grafana Cho Hạ Tầng

Khi truy cập [Grafana (http://localhost:3001)](http://localhost:3001) với tài khoản mặc định `admin` / `admin`, bạn có thể vào mục **Dashboards -> New -> Import** và nhập các ID chuẩn cộng đồng sau để có ngay biểu đồ trực quan:

| Thành phần hạ tầng | Grafana Dashboard ID | Tên Dashboard gợi ý |
| :--- | :---: | :--- |
| **PostgreSQL** | `9628` | PostgreSQL Database |
| **Redis** | `11835` | Redis Dashboard for Prometheus Redis Exporter 1.x |
| **RabbitMQ** | `10991` | RabbitMQ-Prometheus |

---

## 🛠️ 5. Các Lệnh Gỡ Lỗi Thường Gặp (Troubleshooting)

1. **Lỗi `failed to set up container networking: network ... not found`:**
   Xảy ra khi container cũ vẫn lưu ID của mạng Docker đã bị xóa trước đó. Chạy lệnh ép tái tạo lại container:
   ```bash
   cd docker && docker compose up -d --force-recreate
   ```

2. **Lỗi RabbitMQ 403 `ACCESS-REFUSED`:**
   Nếu volume cũ của RabbitMQ không cập nhật mật khẩu mới từ `.env`, chạy lệnh đồng bộ mật khẩu trực tiếp:
   ```bash
   docker exec rabbitmq-tomato_cinema rabbitmqctl change_password <RABBITMQ_USER> <RABBITMQ_PASSWORD>
   docker restart notification_service_tomato_cinema
   ```

3. **Xung đột tên container cũ:**
   ```bash
   docker rm -f redis_tomato_cinema postgres_tomato_cinema rabbitmq-tomato_cinema
   ```

4. **Kiểm tra nhật ký chi tiết của từng service:**
   ```bash
   docker logs gateway_service_tomato_cinema --tail 50
   docker logs auth_service_tomato_cinema --tail 50
   docker logs notification_service_tomato_cinema --tail 50
   ```

5. **Truy cập vào shell bên trong container để debug:**
   ```bash
   docker exec -it auth_service_tomato_cinema sh
   ```
