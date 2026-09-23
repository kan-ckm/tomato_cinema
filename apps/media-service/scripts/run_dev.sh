#!/usr/bin/env bash

echo "🚀 Đang khởi động media-service ở chế độ phát triển (live-reload)..."

# Nạp biến môi trường từ file .env nếu tồn tại
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Chạy Air để tự động biên dịch lại khi sửa code (live reload)
air
