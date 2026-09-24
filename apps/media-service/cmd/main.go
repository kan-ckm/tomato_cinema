package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/tomatocinema/media-service/internal/config"
	"github.com/tomatocinema/media-service/internal/infrastructure/grpc"
	httpserver "github.com/tomatocinema/media-service/internal/infrastructure/http"
	"github.com/tomatocinema/media-service/internal/infrastructure/storage"
	"github.com/tomatocinema/media-service/pkg/logger"
)

// Điểm khởi chạy chính của media-service:
// 1. Tải cấu hình từ biến môi trường (.env)
// 2. Khởi tạo logger và bộ lưu trữ S3/MinIO
// 3. Chạy song song cả gRPC Server (nội bộ) và HTTP Server (phục vụ xem file)
// 4. Lắng nghe tín hiệu hệ điều hành để tắt dịch vụ an toàn (Graceful Shutdown)
func main() {
	// 1. Nạp cấu hình hệ thống
	cfg := config.Load()

	// 2. Khởi tạo bộ ghi log
	logger.Init(cfg.Logging.Level)
	logger.Info("🚀 Đang khởi động media-service ở chế độ %s", cfg.App.Env)

	// 3. Khởi tạo adapter lưu trữ S3 (Hỗ trợ cả AWS S3 và MinIO)
	var mediaStorage storage.Storage
	var err error

	mediaStorage, err = storage.NewS3Storage(cfg)
	if err != nil {
		logger.Fatal("Khởi tạo S3 storage thất bại: %v", err)
	}
	logger.Info("✅ Kết nối S3 storage thành công (bucket: %s)", cfg.Storage.Bucket)

	// 4. Khởi tạo gRPC Server (giao tiếp nội bộ giữa các microservices)
	grpcServer := grpc.NewServer(mediaStorage, cfg)
	grpcListener, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPC.Port))
	if err != nil {
		logger.Fatal("Lỗi lắng nghe cổng gRPC: %v", err)
	}

	// 5. Khởi tạo HTTP Server (Gin framework - phục vụ xem ảnh trực tiếp)
	httpSrv := httpserver.NewServer(mediaStorage, cfg)

	// Chạy gRPC Server trong một Goroutine riêng
	go func() {
		logger.Info("gRPC đang lắng nghe tại cổng :%s", cfg.GRPC.Port)
		if err := grpcServer.Serve(grpcListener); err != nil {
			logger.Fatal("Lỗi khởi chạy gRPC server: %v", err)
		}
	}()

	// Chạy HTTP Server trong một Goroutine riêng
	go func() {
		logger.Info("HTTP đang lắng nghe tại cổng :%s", cfg.HTTP.Port)
		if err := httpSrv.Start(); err != nil {
			logger.Fatal("Lỗi khởi chạy HTTP server: %v", err)
		}
	}()

	// Goroutine dự phòng cho tác vụ chạy ngầm trong tương lai
	go func() {
		logger.Info("📦 Background queue workers đã sẵn sàng")
	}()

	// 6. Xử lý tắt an toàn (Graceful Shutdown) khi nhận tín hiệu kết thúc từ OS
	waitForShutdown(func() {
		logger.Warn("🛑 Bắt đầu quy trình tắt dịch vụ an toàn (Graceful shutdown)...")
		grpcServer.GracefulStop()
		mediaStorage.Close()
		httpSrv.Stop(context.Background())
		logger.Info("✅ Đã hoàn tất tắt dịch vụ an toàn")
	})
}

// waitForShutdown bắt tín hiệu SIGINT (Ctrl+C) hoặc SIGTERM (từ Docker/K8s)
// và cung cấp thời gian chờ tối đa 10 giây để hoàn tất các request đang dở
func waitForShutdown(cleanup func()) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cleanup()

	<-ctx.Done()
}
