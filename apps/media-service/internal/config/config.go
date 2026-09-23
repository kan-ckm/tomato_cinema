package config

import (
	"os"
	"strings"
)

// Config chứa toàn bộ thông số cấu hình của media-service
type Config struct {
	// Cấu hình môi trường chung
	App struct {
		Env string // Môi trường chạy: "development" hoặc "production"
	}

	// Cấu hình HTTP Server (phục vụ người dùng xem/tải media)
	HTTP struct {
		Port string // Cổng lắng nghe (mặc định: 4200)
		Host string // Domain/Host công khai dùng để ghép đường dẫn file (ví dụ: localhost:4200)
	}

	// Cấu hình gRPC Server (tiếp nhận gọi nội bộ từ các microservices)
	GRPC struct {
		Port string // Cổng lắng nghe gRPC (mặc định: 50059)
		Host string // Địa chỉ host gRPC
	}

	// Cấu hình Object Storage (Hỗ trợ AWS S3, MinIO, Cloudflare R2)
	Storage struct {
		Driver    string // Loại driver lưu trữ (ví dụ: "s3")
		Bucket    string // Tên bucket lưu trữ
		Region    string // Vùng S3 (ví dụ: "us-east-1")
		Endpoint  string // Endpoint tùy chỉnh (ví dụ: "http://minio:9000" khi chạy local)
		AccessKey string // Khóa truy cập S3
		SecretKey string // Khóa bí mật S3
		PublicURL string // Đường dẫn công khai hoặc domain CDN trỏ vào bucket
	}

	// Cấu hình giới hạn và xử lý hình ảnh
	Image struct {
		MaxSizeMB    int      // Dung lượng tối đa của file ảnh (MB)
		AllowedTypes []string // Danh sách định dạng ảnh được phép tải lên
	}

	// Cấu hình mức độ ghi log (debug, info, warn, error, fatal)
	Logging struct {
		Level string
	}
}

// Load nạp toàn bộ cấu hình từ biến môi trường hệ thống (.env)
func Load() *Config {
	var cfg Config
	loadFromEnv(&cfg)
	return &cfg
}

// loadFromEnv đọc giá trị từng biến môi trường và gán vào struct Config
func loadFromEnv(cfg *Config) {
	get := func(key string) string {
		return strings.TrimSpace(os.Getenv(key))
	}

	// 1. Cấu hình ứng dụng chung
	cfg.App.Env = get("APP_ENV")

	// 2. Cấu hình HTTP Server
	cfg.HTTP.Port = get("HTTP_PORT")
	cfg.HTTP.Host = get("HTTP_HOST")

	// 3. Cấu hình gRPC Server
	cfg.GRPC.Port = get("GRPC_PORT")
	cfg.GRPC.Host = get("GRPC_HOST")

	// 4. Cấu hình Storage (S3 / MinIO)
	cfg.Storage.Driver = get("S3_DRIVER")
	cfg.Storage.Bucket = get("S3_BUCKET")
	cfg.Storage.Region = get("S3_REGION")
	cfg.Storage.Endpoint = get("S3_ENDPOINT")
	cfg.Storage.AccessKey = get("S3_ACCESS_KEY")
	cfg.Storage.SecretKey = get("S3_SECRET_KEY")
	cfg.Storage.PublicURL = get("S3_PUBLIC_URL")

	// 5. Cấu hình Logger
	cfg.Logging.Level = get("LOG_LEVEL")
}
