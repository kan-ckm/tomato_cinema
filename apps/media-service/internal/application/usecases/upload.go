package usecases

import (
	"context"
	"fmt"

	"github.com/tomatocinema/media-service/internal/application/dto"
	"github.com/tomatocinema/media-service/internal/infrastructure/images"
	"github.com/tomatocinema/media-service/internal/infrastructure/storage"
)

// UploadUseCase thực hiện nghiệp vụ tải lên tệp tin và lưu trữ vào Storage (S3/MinIO)
type UploadUseCase struct {
	storage   storage.Storage  // Adapter giao tiếp lưu trữ
	processor images.Processor // Bộ xử lý tối ưu hóa hình ảnh (resize, chuyển đổi định dạng)
}

// NewUploadUseCase khởi tạo UseCase tải lên tệp tin
func NewUploadUseCase(s storage.Storage, p images.Processor) *UploadUseCase {
	return &UploadUseCase{
		storage:   s,
		processor: p,
	}
}

// Execute thực hiện lưu trữ file dạng luồng (stream):
// 1. Tạo khóa định danh theo cấu trúc: {folder}/{fileName}
// 2. Stream dữ liệu trực tiếp lên S3/MinIO mà không cần lưu tạm ra ổ cứng máy chủ
// 3. Trả về khóa định danh của tệp tin vừa tải lên
func (u *UploadUseCase) Execute(
	ctx context.Context,
	input dto.UploadMediaRequest,
) (*dto.UploadMediaResponse, error) {
	// Tạo key lưu trữ phân cấp theo thư mục
	key := fmt.Sprintf("%s/%s", input.Folder, input.FileName)

	// Truyền luồng dữ liệu trực tiếp vào storage adapter
	if err := u.storage.UploadStream(
		ctx,
		key,
		input.Reader,
		input.ContentType,
	); err != nil {
		return nil, err
	}

	return &dto.UploadMediaResponse{
		Key: key,
	}, nil
}
