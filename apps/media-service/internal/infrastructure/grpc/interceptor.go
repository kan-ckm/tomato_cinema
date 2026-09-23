package grpc

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/teacinema/media-service/pkg/logger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// RequestLoggerInterceptor là gRPC Unary Interceptor ghi nhận log cho mọi cuộc gọi RPC:
// - Đo thời gian thực thi (latency)
// - Ghi nhận trạng thái hoàn thành: Thành công (✅) hoặc Lỗi (❌) kèm tên FullMethod
func RequestLoggerInterceptor(
	ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (interface{}, error) {

	start := time.Now()
	resp, err := handler(ctx, req)

	status := "✅ Thành công"
	if err != nil {
		status = "❌ Thất bại"
	}

	logger.Info("[gRPC] %s: %s (thời gian: %v)", status, info.FullMethod, time.Since(start))
	return resp, err
}

// TraceIDInterceptor đảm bảo tính liên kết vết phân tán (Distributed Tracing):
// - Đọc 'x-trace-id' từ metadata được truyền đến từ API Gateway hoặc service gọi sang
// - Nếu chưa có, tự động sinh UUID mới và gắn vào metadata & context
func TraceIDInterceptor(
	ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		md = metadata.New(nil)
	}

	ids := md.Get("x-trace-id")
	var traceID string
	if len(ids) == 0 {
		traceID = uuid.New().String()
		md.Set("x-trace-id", traceID)
	} else {
		traceID = ids[0]
	}

	ctx = metadata.NewIncomingContext(ctx, md)
	ctx = context.WithValue(ctx, "traceID", traceID)

	return handler(ctx, req)
}
