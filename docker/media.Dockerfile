# syntax=docker/dockerfile:1
# ==============================================================================
# 🐳 DOCKERFILE DÀNH CHO MEDIA SERVICE (GOLANG + DISTROLESS)
# ==============================================================================
# 📌 Vị trí tệp: docker/media.Dockerfile
# 📌 Build Context: Thư mục gốc Monorepo (.)
#
# 💡 Thiết kế áp dụng Multi-Stage Build:
#    - Stage 1 (Builder): Golang Alpine biên dịch nhị phân CGO_ENABLED=0 tĩnh,
#                         sử dụng BuildKit cache mount (/go/pkg/mod & go-build).
#    - Stage 2 (Runner):  Google Distroless Static Debian non-root (~25-30MB),
#                         tích hợp sẵn CA-certificates chuẩn HTTPS (Cloudflare R2).
# ==============================================================================

ARG GO_VERSION=1.24
FROM --platform=$BUILDPLATFORM golang:${GO_VERSION}-alpine AS builder

ENV CGO_ENABLED=0 \
    GOWORK=off \
    GOTOOLCHAIN=local \
    GOFLAGS=-trimpath

WORKDIR /src

# 1. Tải và cache các phụ thuộc Go module
COPY packages/contracts/go.mod packages/contracts/go.sum packages/contracts/
COPY apps/media-service/go.mod apps/media-service/go.sum apps/media-service/

WORKDIR /src/apps/media-service
RUN --mount=type=cache,target=/go/pkg/mod go mod download

# 2. Sao chép mã nguồn đã tạo của contracts và media-service
# (replace directive trong go.mod trỏ tới ../../packages/contracts)
COPY packages/contracts/gen/go /src/packages/contracts/gen/go
COPY apps/media-service/ /src/apps/media-service/

ARG TARGETOS TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    GOOS=$TARGETOS GOARCH=$TARGETARCH go build -ldflags="-s -w" -o /out/media-service ./cmd

# ------------------------------------------------------------------------------
# 🔴 STAGE 2: RUNNER - DISTROLESS NON-ROOT SIÊU NHẸ VÀ BẢO MẬT
# ------------------------------------------------------------------------------
FROM gcr.io/distroless/static-debian12:nonroot AS runner

WORKDIR /
COPY --from=builder /out/media-service /media-service

USER nonroot:nonroot

EXPOSE 4200 50059

ENTRYPOINT ["/media-service"]
