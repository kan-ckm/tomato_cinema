# ==============================================================================
# 🐳 DOCKERFILE ĐA NĂNG CHO MONOREPO (TURBOREPO + PNPM + NESTJS MICROSERVICES)
# ==============================================================================
# 
# 📌 Vị trí tệp: docker/Dockerfile
# 📌 Build Context: Thư mục gốc Monorepo (..)
# 
# 💡 Thiết kế này áp dụng kỹ thuật Multi-Stage Build gồm 4 tầng tối ưu:
#    - Stage 1 (Base):    Khởi tạo Node.js 22 Alpine & cài pnpm 9.
#    - Stage 2 (Pruner):  Dùng Turborepo "cắt tỉa" Monorepo, chỉ lấy đúng service cần build.
#    - Stage 3 (Builder): Cài đặt thư viện, biên dịch Protobuf, Prisma và TypeScript.
#    - Stage 4 (Runner):  Tạo container chạy Production siêu nhẹ (~150-240MB), chạy user phi root.
# 
# 🚀 Cách dùng lệnh độc lập từ thư mục gốc:
#    docker build -f docker/Dockerfile --build-arg APP_NAME=auth-service -t auth-service .
#    docker build -f docker/Dockerfile --build-arg APP_NAME=gateway-service -t gateway-service .
# ==============================================================================

# Khai báo biến ARG toàn cục nhận tên service mục tiêu (mặc định: auth-service)
ARG APP_NAME=auth-service

# ------------------------------------------------------------------------------
# 🟢 STAGE 1: BASE - CÀI ĐẶT NODE.JS RUNTIME & CÔNG CỤ QUẢN LÝ GÓI PNPM
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

# Cấu hình biến môi trường cho PNPM
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Cài đặt pnpm@9.0.0 trực tiếp qua npm (Tránh dùng Corepack vốn đang bị deprecated trong Node.js)
RUN npm install -g pnpm@9.0.0

# Chỉ định thư mục lưu trữ cục bộ cho pnpm store
RUN pnpm config set store-dir /pnpm/store

# ------------------------------------------------------------------------------
# 🟡 STAGE 2: PRUNER - CẮT TỈA MONOREPO VỚI VŨ KHÍ BÍ MẬT "TURBO PRUNE"
# ------------------------------------------------------------------------------
# Mục đích: Monorepo có rất nhiều apps và packages. Nếu mang tất cả vào Docker sẽ làm Image
# phình to và mất sạch Docker Cache. Lệnh "turbo prune" tự động trích xuất đúng mã nguồn
# của service mục tiêu cùng các package nội bộ mà nó thực sự import.
# ------------------------------------------------------------------------------
FROM base AS pruner
ARG APP_NAME
WORKDIR /app

# Cài đặt Turborepo CLI khớp với phiên bản dự án
RUN pnpm add -g turbo@^2.10.7

# Copy toàn bộ cấu trúc dự án vào để Turborepo phân tích cây phụ thuộc
COPY . .

# turbo prune tạo ra 2 thư mục trong /app/out:
#  1. out/json: Chứa toàn bộ package.json và pnpm-lock.yaml liên quan (dùng để cài dependencies)
#  2. out/full: Chứa toàn bộ source code thực tế của service mục tiêu và các packages phụ thuộc
RUN turbo prune ${APP_NAME} --docker

# ------------------------------------------------------------------------------
# 🔵 STAGE 3: BUILDER - CÀI ĐẶT THƯ VIỆN VÀ BIÊN DỊCH MÃ NGUỒN SANG JAVASCRIPT
# ------------------------------------------------------------------------------
FROM base AS builder
ARG APP_NAME
WORKDIR /app

# 1. Cài đặt các công cụ hệ thống cấp OS (Alpine):
#    - protobuf & protobuf-dev: Trình biên dịch protoc và các tệp định nghĩa proto chuẩn của Google
#      (Timestamp, Empty, Any) để biên dịch @tomatocinema/contracts.
#    - openssl & libc6-compat: Yêu cầu bắt buộc để Prisma ORM và gRPC native engine hoạt động trên Alpine.
#    - ln -s: Tạo liên kết tượng trưng đưa Google Protobuf vào đường dẫn tìm kiếm mặc định /usr/local/include
RUN apk add --no-cache protobuf protobuf-dev openssl libc6-compat && \
    mkdir -p /usr/local/include && \
    ln -s /usr/include/google /usr/local/include/google

# 2. TỐI ƯU HÓA DOCKER LAYER CACHING:
#    Chỉ copy tệp package manifests (out/json) trước để chạy "pnpm install".
#    Nhờ đó, mỗi khi bạn chỉ sửa mã nguồn .ts mà không thêm package mới,
#    Docker sẽ LẤY TOÀN BỘ BƯỚC NÀY TỪ CACHE (không phải tải lại thư viện)!
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# 3. Copy toàn bộ mã nguồn thực tế đã được cắt tỉa vào
COPY --from=pruner /app/out/full/ .

# 4. TỰ ĐỘNG NHẬN DIỆN PRISMA ORM:
#    Kiểm tra nếu service có file "prisma/schema.prisma" (ví dụ auth-service),
#    thì tự động chạy "prisma generate" để sinh mã truy vấn DB vào thư mục generated.
#    Nếu service không dùng Prisma (như gateway-service), bước này sẽ tự động bỏ qua an toàn.
RUN if [ -f "apps/${APP_NAME}/prisma/schema.prisma" ]; then \
      echo "⚡ Phát hiện Prisma Schema! Đang sinh Prisma Client cho ${APP_NAME}..."; \
      pnpm --filter ${APP_NAME} exec prisma generate; \
    fi

# 5. BIÊN DỊCH TOPOLOGICAL VỚI TURBOREPO:
#    Dấu ba chấm (...) ở cuối (${APP_NAME}...) ra lệnh cho Turborepo biên dịch các package
#    dùng chung trước (@tomatocinema/contracts -> core -> common -> passport) rồi mới build service chính.
RUN pnpm turbo run build --filter=${APP_NAME}...

# ------------------------------------------------------------------------------
# 🔴 STAGE 4: RUNNER - CONTAINER MÔI TRƯỜNG PRODUCTION (SIÊU NHẸ & AN TOÀN)
# ------------------------------------------------------------------------------
# Toàn bộ mã nguồn TypeScript thô, trình biên dịch Nest CLI, Turbo, ESLint, v.v.
# đều bị VỨT BỎ lại ở tầng Builder. Tầng này chỉ chứa các file chạy cần thiết.
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
ARG APP_NAME
WORKDIR /app

# Cài đặt OpenSSL và libc6-compat cho runtime của Prisma & gRPC
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}

# NGUYÊN TẮC BẢO MẬT (LEAST PRIVILEGE):
# Tạo user phi đặc quyền "nestjs:nodejs" để chạy ứng dụng, TUYỆT ĐỐI không chạy bằng quyền root!
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy node_modules chạy runtime và tệp cấu hình package.json
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Copy các package dùng chung (bao gồm thư mục dist và các tệp .proto cần cho gRPC runtime)
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

# Copy thư mục service đã biên dịch sang JavaScript (dist/)
COPY --from=builder --chown=nestjs:nodejs /app/apps/${APP_NAME} ./apps/${APP_NAME}

# Chuyển sang user bảo mật
USER nestjs

# Khai báo các cổng giao tiếp (HTTP API: 4000, gRPC Services: 50051, 50052)
EXPOSE 4000 50051 50052

# LỆNH KHỞI CHẠY THÔNG MINH:
# 1. Tự động chạy "prisma db push" nếu service có dùng Prisma (ví dụ: auth-service)
# 2. Nhận diện entry point thực tế của service:
#    - gateway-service compile ra: apps/gateway-service/dist/main.js
#    - auth-service compile ra:    apps/auth-service/dist/src/main.js
CMD ["sh", "-c", "if [ -f apps/${APP_NAME}/prisma/schema.prisma ]; then (cd apps/${APP_NAME} && ./node_modules/.bin/prisma db push --accept-data-loss); fi && if [ -f apps/${APP_NAME}/dist/main.js ]; then node apps/${APP_NAME}/dist/main.js; else node apps/${APP_NAME}/dist/src/main.js; fi"]

