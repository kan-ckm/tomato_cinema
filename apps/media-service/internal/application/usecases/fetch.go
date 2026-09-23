package usecases

import (
	"context"

	"github.com/teacinema/media-service/internal/application/dto"
	"github.com/teacinema/media-service/internal/infrastructure/storage"
)

// GetUseCase thực hiện nghiệp vụ lấy luồng dữ liệu tệp tin từ Storage bằng khóa định danh
type GetUseCase struct {
	storage storage.Storage // Adapter lưu trữ dữ liệu
}

// NewGetUseCase khởi tạo UseCase truy xuất tệp tin
func NewGetUseCase(s storage.Storage) *GetUseCase {
	return &GetUseCase{storage: s}
}

// Execute lấy luồng dữ liệu (io.ReadCloser) và loại nội dung (ContentType) của tệp tin:
// Caller có trách nhiệm gọi Close() trên Reader sau khi đọc xong để giải phóng kết nối
func (u *GetUseCase) Execute(
	ctx context.Context,
	input dto.GetMediaRequest,
) (*dto.GetMediaResponse, error) {
	reader, contentType, err := u.storage.GetStream(ctx, input.Key)
	if err != nil {
		return nil, err
	}

	return &dto.GetMediaResponse{
		Reader:      reader,
		ContentType: contentType,
	}, nil
}
