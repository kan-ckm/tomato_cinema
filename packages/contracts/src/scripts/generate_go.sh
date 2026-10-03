#!/bin/sh
set -e

if ! command -v protoc-gen-go >/dev/null 2>&1 || ! command -v protoc-gen-go-grpc >/dev/null 2>&1; then
    echo "⚠️ Bỏ qua tạo protobuf Go: protoc-gen-go hoặc protoc-gen-go-grpc chưa được cài đặt trong môi trường này."
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "Tạo protobuf Go (media)..."

protoc -I ./proto \
    --go_out=. \
    --go_opt=module=github.com/tomatocinema/contracts \
    --go-grpc_out=. \
    --go-grpc_opt=module=github.com/tomatocinema/contracts \
    ./proto/media.proto

echo "Go đã tạo xong!"