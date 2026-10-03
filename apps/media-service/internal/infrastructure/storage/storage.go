package storage

import (
	"context"
	"io"
)

// FileInfo chứa siêu dữ liệu tóm tắt của một tệp tin
type FileInfo struct {
	URL      string // Đường dẫn truy cập công khai
	Size     int64  // Kích thước tệp (bytes)
	MIMEType string // Định dạng MIME của tệp
}

// Storage là giao diện trừu tượng cho mọi dịch vụ lưu trữ (Cloudflare R2, MinIO, GCS, Local Disk):
// Giúp tầng UseCase hoàn toàn độc lập với công nghệ lưu trữ cụ thể
type Storage interface {
	// UploadStream tải lên tệp tin dạng luồng dữ liệu mà không cần tải hết vào RAM
	UploadStream(
		ctx context.Context,
		key string,
		reader io.Reader,
		contentType string,
	) error

	// GetStream lấy luồng đọc tệp tin (io.ReadCloser) và ContentType từ Storage
	GetStream(
		ctx context.Context,
		key string,
	) (io.ReadCloser, string, error)

	// Delete xóa tệp tin khỏi Storage bằng khóa định danh (key)
	Delete(ctx context.Context, key string) error

	// Close giải phóng các kết nối tài nguyên của Storage
	Close() error
}
