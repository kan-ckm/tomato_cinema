package grpc

import (
	"bytes"
	"context"

	pb "github.com/tomatocinema/contracts/gen/go/media/v1"
	"github.com/tomatocinema/media-service/internal/application/dto"
	"github.com/tomatocinema/media-service/internal/application/usecases"
)

// MediaHandler triển khai các phương thức định nghĩa trong protobuf MediaServiceServer:
// Đóng vai trò là Adapter cầu nối chuyển đổi giữa protobuf request và tầng UseCase nội bộ
type MediaHandler struct {
	pb.UnimplementedMediaServiceServer
	uploadUC *usecases.UploadUseCase // Nghiệp vụ tải lên
	getUC    *usecases.GetUseCase    // Nghiệp vụ truy xuất
	deleteUC *usecases.DeleteUseCase // Nghiệp vụ xóa
}

// NewMediaHandler khởi tạo gRPC Handler với các UseCase phụ thuộc
func NewMediaHandler(
	u *usecases.UploadUseCase,
	g *usecases.GetUseCase,
	d *usecases.DeleteUseCase,
) *MediaHandler {
	return &MediaHandler{
		uploadUC: u,
		getUC:    g,
		deleteUC: d,
	}
}

// Upload tiếp nhận cuộc gọi RPC Upload từ các service khác (User, Movie, Auth):
// 1. Chuyển đổi dữ liệu nhị phân bytes.NewReader(req.Data) thành luồng io.Reader
// 2. Gọi UploadUseCase để lưu trữ vào Storage (Cloudflare R2/MinIO)
// 3. Trả về protobuf UploadResponse chứa khóa (Key) của tệp tin
func (h *MediaHandler) Upload(
	ctx context.Context,
	req *pb.UploadRequest,
) (*pb.UploadResponse, error) {
	res, err := h.uploadUC.Execute(ctx, dto.UploadMediaRequest{
		FileName:    req.FileName,
		Folder:      req.Folder,
		ContentType: req.ContentType,
		Reader:      bytes.NewReader(req.Data),
		Size:        int64(len(req.Data)),
	})

	if err != nil {
		return nil, err
	}

	return &pb.UploadResponse{
		Key: res.Key,
	}, nil
}
