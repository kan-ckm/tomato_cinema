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
	stdgrpc "google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

// Điểm khởi chạy chính của media-service:
// 1. Hỗ trợ subcommand 'healthcheck' phục vụ Docker container HEALTHCHECK
// 2. Tải cấu hình từ biến môi trường (.env)
// 3. Khởi tạo logger và bộ lưu trữ S3/MinIO
// 4. Chạy song song cả gRPC Server (nội bộ) và HTTP Server (phục vụ xem file)
// 5. Lắng nghe tín hiệu hệ điều hành để tắt dịch vụ an toàn (Graceful Shutdown)
func main() {
	// Kiểm tra nếu gọi subcommand healthcheck từ Docker container HEALTHCHECK
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		runHealthCheck()
		return
	}

	// 1. Nạp cấu hình hệ thống
	cfg := config.Load()

	// 2. Khởi tạo bộ ghi log
	logger.Init(cfg.Logging.Level)
	logger.Info("🚀 Đang khởi động media-service ở chế độ %s", cfg.App.Env)

	// 3. Khởi tạo adapter lưu trữ Storage (Hỗ trợ Cloudflare R2 và MinIO)
	var mediaStorage storage.Storage
	var err error

	mediaStorage, err = storage.NewS3Storage(cfg)
	if err != nil {
		logger.Fatal("Khởi tạo S3 storage thất bại: %v", err)
	}
	logger.Info("✅ Kết nối S3 storage thành công (bucket: %s)", cfg.Storage.Bucket)

	// 4. Khởi tạo gRPC Server (giao tiếp nội bộ giữa các microservices)
	grpcServer, healthServer := grpc.NewServer(mediaStorage, cfg)
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
	waitForShutdown(func(ctx context.Context) {
		logger.Warn("🛑 Bắt đầu quy trình tắt dịch vụ an toàn (Graceful shutdown)...")
		if healthServer != nil {
			healthServer.Shutdown()
		}

		// Dừng gRPC server an toàn với timeout
		grpcStopped := make(chan struct{})
		go func() {
			grpcServer.GracefulStop()
			close(grpcStopped)
		}()

		select {
		case <-grpcStopped:
			logger.Info("gRPC server đã dừng hoàn tất")
		case <-ctx.Done():
			logger.Warn("Quá hạn thời gian chờ gRPC, ngắt kết nối gRPC server ngay lập tức")
			grpcServer.Stop()
		}

		if err := httpSrv.Stop(ctx); err != nil {
			logger.Error("Lỗi dừng HTTP server: %v", err)
		}
		if err := mediaStorage.Close(); err != nil {
			logger.Error("Lỗi đóng Storage: %v", err)
		}
		logger.Info("✅ Đã hoàn tất tắt dịch vụ an toàn")
	})
}

// runHealthCheck thực hiện gRPC health check tới cổng nội bộ
func runHealthCheck() {
	cfg := config.Load()
	addr := fmt.Sprintf("127.0.0.1:%s", cfg.GRPC.Port)

	conn, err := stdgrpc.NewClient(
		addr,
		stdgrpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Lỗi tạo kết nối gRPC health check: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	client := healthpb.NewHealthClient(conn)
	resp, err := client.Check(ctx, &healthpb.HealthCheckRequest{Service: ""})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Gọi gRPC HealthCheck thất bại: %v\n", err)
		os.Exit(1)
	}

	if resp.Status != healthpb.HealthCheckResponse_SERVING {
		fmt.Fprintf(os.Stderr, "Trạng thái service không sẵn sàng: %v\n", resp.Status)
		os.Exit(1)
	}

	os.Exit(0)
}

// waitForShutdown bắt tín hiệu SIGINT (Ctrl+C) hoặc SIGTERM (từ Docker/K8s)
// và cung cấp thời gian chờ tối đa 10 giây để hoàn tất các request đang dở
func waitForShutdown(cleanup func(ctx context.Context)) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cleanup(ctx)
}
