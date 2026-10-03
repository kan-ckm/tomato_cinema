package grpc

import (
	"fmt"
	"net"

	pb "github.com/tomatocinema/contracts/gen/go/media/v1"
	"github.com/tomatocinema/media-service/internal/application/usecases"
	"github.com/tomatocinema/media-service/internal/config"
	"github.com/tomatocinema/media-service/internal/infrastructure/images"
	"github.com/tomatocinema/media-service/internal/infrastructure/storage"
	handler "github.com/tomatocinema/media-service/internal/interfaces/grpc"
	"github.com/tomatocinema/media-service/pkg/logger"
	"google.golang.org/grpc"
)

// NewServer khởi tạo và cấu hình gRPC Server:
// 1. Đăng ký chuỗi Interceptor (Logging đo độ trễ + Bắt TraceID)
// 2. Khởi tạo các UseCase (Upload, Get, Delete)
// 3. Đăng ký MediaServiceServer với protobuf gRPC runtime
func NewServer(storage storage.Storage, cfg *config.Config) *grpc.Server {
	server := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			RequestLoggerInterceptor,
			TraceIDInterceptor,
		),
	)

	// Khởi tạo các UseCase nghiệp vụ
	uploadUC := usecases.NewUploadUseCase(storage, images.NewImageProcessor())
	getUC := usecases.NewGetUseCase(storage)
	deleteUC := usecases.NewDeleteUseCase(storage)

	// Đăng ký Handler xử lý protobuf
	h := handler.NewMediaHandler(uploadUC, getUC, deleteUC)
	pb.RegisterMediaServiceServer(server, h)

	return server
}

// StartGRPC lắng nghe cổng TCP và khởi chạy gRPC server
func StartGRPC(server *grpc.Server, port int) error {
	addr := fmt.Sprintf(":%d", port)
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}

	logger.Info("gRPC server đang lắng nghe tại %s", addr)
	return server.Serve(lis)
}
