# syntax=docker/dockerfile:1
# ==============================================================================
# 🐳 DOCKERFILE ĐA NĂNG CHO MONOREPO (TURBOREPO + PNPM + NESTJS MICROSERVICES)
# ==============================================================================
# 
# 📌 Vị trí tệp: docker/Dockerfile
# 📌 Build Context: Thư mục gốc Monorepo (.)
# 
# 💡 Thiết kế áp dụng kỹ thuật Multi-Stage Build tối ưu đột phá:
#    - Stage 1 (Base):     Khởi tạo Node.js 22 Alpine & cài pnpm 9 có cache npm.
#    - Stage 2 (Pruner):   Dùng Turborepo cắt tỉa đồng thời toàn bộ microservices backend.
#    - Stage 3 (Builder):  Build DUY NHẤT 1 LẦN cho toàn bộ backend (BuildKit dedupes stage).
#                          Cài đặt thư viện (cache mount /pnpm/store), sinh Prisma Client,
#                          biên dịch song song bằng Turborepo. Không phụ thuộc APP_NAME.
#    - Stage 4 (Deployer): Trích xuất từng microservice độc lập qua "pnpm deploy --prod",
#                          tận dụng cache pnpm store offline để hoàn tất chỉ trong 1-2 giây.
#    - Stage 5 (Runner):   Tạo container chạy Production siêu nhẹ (~200-300MB), user phi root,
#                          chạy qua /sbin/tini để đảm bảo Graceful Shutdown chuẩn POSIX.
# 
# 🚀 Cách dùng lệnh độc lập từ thư mục gốc:
#    docker build -f docker/Dockerfile --build-arg APP_NAME=auth-service -t tomato-cinema/auth-service:latest .
#    docker build -f docker/Dockerfile --build-arg APP_NAME=gateway-service -t tomato-cinema/gateway-service:latest .
# ==============================================================================

# Khai báo danh sách các microservices backend trong monorepo
ARG BACKEND_APPS="auth-service user-service gateway-service notification-service bot-service"

# ------------------------------------------------------------------------------
# 🟢 STAGE 1: BASE - CÀI ĐẶT NODE.JS RUNTIME & CÔNG CỤ QUẢN LÝ GÓI PNPM
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Cài đặt pnpm@9.0.0 với BuildKit cache mount cho npm
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@9.0.0

# Chỉ định thư mục lưu trữ cục bộ cho pnpm store
RUN pnpm config set store-dir /pnpm/store

# ------------------------------------------------------------------------------
# 🟡 STAGE 2: PRUNER - CẮT TỈA MONOREPO ĐỒNG THỜI VỚI "TURBO PRUNE"
# ------------------------------------------------------------------------------
FROM base AS pruner
ARG BACKEND_APPS
WORKDIR /app

# Cài đặt Turborepo CLI khớp với phiên bản dự án có cache
RUN --mount=type=cache,target=/root/.npm npm install -g turbo@2.10.7

# Copy toàn bộ cấu trúc dự án vào để Turborepo phân tích cây phụ thuộc
COPY . .

# turbo prune tạo cây tối thiểu cho tất cả microservices backend
RUN turbo prune ${BACKEND_APPS} --docker

# ------------------------------------------------------------------------------
# 🔵 STAGE 3: BUILDER - BIÊN DỊCH DÙNG CHUNG (SHARED BUILD PIPELINE)
# ------------------------------------------------------------------------------
# Lưu ý: Stage này KHÔNG phụ thuộc vào APP_NAME, giúp BuildKit thực hiện duy nhất
# 1 lần build khi build cụm docker-compose thay vì lặp lại 5 lần riêng lẻ!
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# 1. Cài đặt các công cụ hệ thống cấp OS với cache apk:
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache protobuf protobuf-dev openssl libc6-compat && \
    mkdir -p /usr/local/include && \
    ln -s /usr/include/google /usr/local/include/google

# 2. Tối ưu hóa cài đặt thư viện bằng BuildKit cache mount:
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    --mount=type=cache,id=pnpm-cache,target=/root/.cache/pnpm \
    pnpm install --frozen-lockfile

# 3. Copy toàn bộ mã nguồn đã cắt tỉa vào
COPY --from=pruner /app/out/full/ .

# 4. Tự động nhận diện và sinh Prisma Client cho các service có schema:
RUN for s in apps/*/prisma/schema.prisma; do \
      [ -f "$s" ] || continue; \
      app="$(echo "$s" | cut -d/ -f2)"; \
      echo "⚡ Phát hiện Prisma Schema! Đang sinh Prisma Client cho ${app}..."; \
      pnpm --filter "${app}" exec prisma generate; \
    done

# 5. Biên dịch toàn bộ Monorepo bằng Turborepo:
RUN --mount=type=cache,id=turbo,target=/app/.turbo pnpm turbo run build

# ------------------------------------------------------------------------------
# 🟣 STAGE 4: DEPLOYER - BÓC TÁCH PRODUCTION RUNTIME CHO TỪNG SERVICE
# ------------------------------------------------------------------------------
FROM builder AS deployer
ARG APP_NAME
WORKDIR /app

# Tách riêng production dependencies vào /prod với cache mount
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    --mount=type=cache,id=pnpm-cache,target=/root/.cache/pnpm \
    pnpm --filter=${APP_NAME} deploy --prod --prefer-offline /prod && \
    rm -rf /prod/src /prod/test /prod/tsconfig*.json && \
    cp -r apps/${APP_NAME}/dist /prod/dist && \
    if [ -d "apps/${APP_NAME}/generated" ]; then cp -r apps/${APP_NAME}/generated /prod/generated; fi && \
    if [ -d "apps/${APP_NAME}/prisma" ]; then cp -r apps/${APP_NAME}/prisma /prod/prisma; fi

# Dọn dẹp các tệp bản đồ (.map), tài liệu (.md) trong node_modules để giảm thêm dung lượng
RUN find /prod/node_modules -type f \( -name "*.map" -o -name "*.md" -o -name "*.markdown" -o -name "*.tsbuildinfo" \) \
    ! -iname "*license*" ! -iname "*notice*" -delete

# ------------------------------------------------------------------------------
# 🔴 STAGE 5: RUNNER - CONTAINER PRODUCTION (SIÊU NHẸ, BẢO MẬT & GRACEFUL SHUTDOWN)
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
COPY --from=deployer --chown=nestjs:nodejs /prod /app

# Tạo symlink tương thích ngược cho các scripts gọi theo định dạng apps/${APP_NAME}
RUN mkdir -p /app/apps && ln -s /app /app/apps/${APP_NAME}

# Chuyển sang user bảo mật
USER nestjs

# Khai báo các cổng giao tiếp chuẩn
EXPOSE 4000 50051 50052 9101 9102

# Sử dụng tini làm PID 1 init process:
ENTRYPOINT ["/sbin/tini", "--"]

# LỆNH KHỞI CHẠY AN TOÀN:
CMD ["sh", "-c", "if [ \"$AUTO_MIGRATE\" = 'true' ] && [ -f prisma/schema.prisma ]; then ./node_modules/.bin/prisma db push; fi && if [ -f dist/main.js ]; then exec node dist/main.js; else exec node dist/src/main.js; fi"]
