package usecases

import (
	"context"

	"github.com/tomatocinema/media-service/internal/application/dto"
	"github.com/tomatocinema/media-service/internal/infrastructure/storage"
)

// DeleteUseCase thực hiện nghiệp vụ xóa tệp tin khỏi Storage bằng khóa định danh
type DeleteUseCase struct {
	storage storage.Storage // Adapter giao tiếp lưu trữ
}

// NewDeleteUseCase khởi tạo UseCase xóa tệp tin
func NewDeleteUseCase(s storage.Storage) *DeleteUseCase {
	return &DeleteUseCase{storage: s}
}

// Execute xóa tệp tin tương ứng với khóa (key) khỏi S3/MinIO bucket
func (u *DeleteUseCase) Execute(ctx context.Context, input dto.DeleteMediaRequest) (*dto.DeleteMediaResponse, error) {
	err := u.storage.Delete(ctx, input.Key)
	if err != nil {
		return nil, err
	}
	return &dto.DeleteMediaResponse{OK: true}, nil
}
