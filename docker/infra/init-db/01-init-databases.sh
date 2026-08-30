#!/bin/bash
# ==============================================================================
# Script khởi tạo database riêng cho từng microservice.
# Script này chỉ chạy 1 lần duy nhất khi volume PostgreSQL còn mới (chưa có data).
# ==============================================================================
set -e

# 1. Tạo 2 Database auth và users (nếu chưa tồn tại)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE auth' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth')\gexec
    SELECT 'CREATE DATABASE users' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'users')\gexec
EOSQL

echo "✅ Databases 'auth' and 'users' are ready."
