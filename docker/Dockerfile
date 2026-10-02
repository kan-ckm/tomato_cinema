# syntax=docker/dockerfile:1
# ==============================================================================
# 🐳 DOCKERFILE ĐA NĂNG CHO MONOREPO (TURBOREPO + PNPM + NESTJS MICROSERVICES)
# ==============================================================================
# 
# 📌 Vị trí tệp: docker/Dockerfile
# 📌 Build Context: Thư mục gốc Monorepo (.)
# 
# 💡 Thiết kế áp dụng kỹ thuật Multi-Stage Build gồm 4 tầng tối ưu:
#    - Stage 1 (Base):    Khởi tạo Node.js 22 Alpine & cài pnpm 9 có cache npm.
#    - Stage 2 (Pruner):  Dùng Turborepo "cắt tỉa" Monorepo, chỉ trích xuất đúng service cần build.
#    - Stage 3 (Builder): Cài đặt thư viện với BuildKit cache mount (/pnpm/store), biên dịch
#                         Protobuf, Prisma, TypeScript và bóc tách Production standalone bằng "pnpm deploy --prod".
#    - Stage 4 (Runner):  Tạo container chạy Production siêu nhẹ (~200-300MB), user phi root,
#                         chạy qua /sbin/tini để đảm bảo Graceful Shutdown chuẩn POSIX.
# 
# 🚀 Cách dùng lệnh độc lập từ thư mục gốc:
#    docker build -f docker/Dockerfile --build-arg APP_NAME=auth-service -t tomato-cinema/auth-service:latest .
#    docker build -f docker/Dockerfile --build-arg APP_NAME=gateway-service -t tomato-cinema/gateway-service:latest .
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

# Cài đặt pnpm@9.0.0 với BuildKit cache mount cho npm
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@9.0.0

# Chỉ định thư mục lưu trữ cục bộ cho pnpm store
RUN pnpm config set store-dir /pnpm/store

# ------------------------------------------------------------------------------
# 🟡 STAGE 2: PRUNER - CẮT TỈA MONOREPO VỚI "TURBO PRUNE"
# ------------------------------------------------------------------------------
# Trích xuất cây thư mục tối thiểu của service mục tiêu và các package nội bộ mà nó phụ thuộc
# ------------------------------------------------------------------------------
FROM base AS pruner
ARG APP_NAME
WORKDIR /app

# Cài đặt Turborepo CLI khớp với phiên bản dự án có cache
RUN --mount=type=cache,target=/pnpm/store pnpm add -g turbo@^2.10.7

# Copy toàn bộ cấu trúc dự án vào để Turborepo phân tích cây phụ thuộc
COPY . .

# turbo prune tạo ra 2 thư mục trong /app/out:
#  1. out/json: Chứa toàn bộ package.json và pnpm-lock.yaml liên quan
#  2. out/full: Chứa toàn bộ source code thực tế của service mục tiêu và các packages phụ thuộc
RUN turbo prune ${APP_NAME} --docker

# ------------------------------------------------------------------------------
# 🔵 STAGE 3: BUILDER - CÀI ĐẶT THƯ VIỆN, BIÊN DỊCH VÀ CÔ LẬP PRODUCTION DEPS
# ------------------------------------------------------------------------------
FROM base AS builder
ARG APP_NAME
WORKDIR /app

# 1. Cài đặt các công cụ hệ thống cấp OS với cache apk:
#    - protobuf & protobuf-dev: Trình biên dịch protoc và các proto chuẩn của Google
#    - openssl & libc6-compat: Yêu cầu bắt buộc để Prisma ORM và gRPC native engine hoạt động trên Alpine
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache protobuf protobuf-dev openssl libc6-compat && \
    mkdir -p /usr/local/include && \
    ln -s /usr/include/google /usr/local/include/google

# 2. TỐI ƯU HÓA DOCKER LAYER CACHING VỚI BUILDKIT CACHE MOUNT:
#    Dùng cache mount persistent cho /pnpm/store, giúp không phải tải lại thư viện qua internet
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 3. Copy toàn bộ mã nguồn thực tế đã được cắt tỉa vào
COPY --from=pruner /app/out/full/ .

# 4. TỰ ĐỘNG NHẬN DIỆN PRISMA ORM:
RUN if [ -f "apps/${APP_NAME}/prisma/schema.prisma" ]; then \
      echo "⚡ Phát hiện Prisma Schema! Đang sinh Prisma Client cho ${APP_NAME}..."; \
      pnpm --filter ${APP_NAME} exec prisma generate; \
    fi

# 5. BIÊN DỊCH VỚI TURBOREPO (Tận dụng cache .turbo):
RUN --mount=type=cache,target=/app/.turbo pnpm turbo run build --filter=${APP_NAME}...

# 6. BƯỚC ĐỘT PHÁ TỐI ƯU DUNG LƯỢNG (PNPM DEPLOY STANDALONE):
#    Cô lập service và toàn bộ production dependencies vào /prod, loại bỏ toàn bộ devDependencies
RUN pnpm --filter=${APP_NAME} deploy --prod /prod && \
    cp -r apps/${APP_NAME}/dist /prod/dist && \
    if [ -d "apps/${APP_NAME}/generated" ]; then cp -r apps/${APP_NAME}/generated /prod/generated; fi && \
    if [ -d "apps/${APP_NAME}/prisma" ]; then cp -r apps/${APP_NAME}/prisma /prod/prisma; fi

# ------------------------------------------------------------------------------
# 🔴 STAGE 4: RUNNER - CONTAINER PRODUCTION (SIÊU NHẸ, BẢO MẬT & GRACEFUL SHUTDOWN)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
ARG APP_NAME
WORKDIR /app

# Cài đặt OpenSSL, libc6-compat và tini (init system xử lý PID 1)
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache openssl libc6-compat tini

ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}

# NGUYÊN TẮC BẢO MẬT (LEAST PRIVILEGE):
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Chỉ copy đúng thư mục /prod đã được tối ưu sạch sẽ
COPY --from=builder --chown=nestjs:nodejs /prod /app

# Tạo symlink tương thích ngược cho các scripts gọi theo định dạng apps/${APP_NAME}
RUN mkdir -p /app/apps && ln -s /app /app/apps/${APP_NAME}

# Chuyển sang user bảo mật
USER nestjs

# Khai báo các cổng giao tiếp chuẩn
EXPOSE 4000 50051 50052 9101 9102

# Sử dụng tini làm PID 1 init process:
# Đảm bảo chuyển tiếp chuẩn tín hiệu SIGTERM/SIGINT tới Node.js để Graceful Shutdown
ENTRYPOINT ["/sbin/tini", "--"]

# LỆNH KHỞI CHẠY AN TOÀN:
# 1. Chỉ chạy prisma db push khi cờ AUTO_MIGRATE=true (môi trường dev/test) và KHÔNG dùng cờ nguy hiểm --accept-data-loss
# 2. Dùng "exec node ..." để tiến trình Node.js nhận trực tiếp signals từ tini
CMD ["sh", "-c", "if [ \"$AUTO_MIGRATE\" = 'true' ] && [ -f prisma/schema.prisma ]; then ./node_modules/.bin/prisma db push; fi && if [ -f dist/main.js ]; then exec node dist/main.js; else exec node dist/src/main.js; fi"]
