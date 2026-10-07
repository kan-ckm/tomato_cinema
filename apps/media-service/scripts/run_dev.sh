#!/usr/bin/env bash

echo "🚀 Đang khởi động media-service ở chế độ phát triển (live-reload)..."

# Di chuyển về thư mục gốc của media-service
cd "$(dirname "$0")/.." || exit 1

# Đảm bảo GOPATH/bin có trong PATH
if command -v go &> /dev/null; then
  GOPATH_BIN="$(go env GOPATH)/bin"
  if [ -d "$GOPATH_BIN" ] && [[ ":$PATH:" != *":$GOPATH_BIN:"* ]]; then
    export PATH="$PATH:$GOPATH_BIN"
  fi
fi

# Nạp biến môi trường từ file .env nếu tồn tại
if [ -f ".env" ]; then
  set -a
  # shellcheck source=/dev/null
  . ./.env
  set +a
fi

# Kiểm tra công cụ air để live reload
if ! command -v air &> /dev/null; then
  echo "⚠️ Không tìm thấy lệnh 'air'. Bạn có thể cài đặt bằng lệnh: go install github.com/air-verse/air@latest"
  echo "⚡ Đang chạy tạm thời qua 'go run ./cmd' (không hỗ trợ live-reload)..."
  exec go run ./cmd
fi

# Chạy Air để tự động biên dịch lại khi sửa code (live reload)
air

