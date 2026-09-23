package images

import (
	"io"
)

// ResizeOptions cấu hình kích thước và cách cắt ảnh khi xử lý
type ResizeOptions struct {
	Width  int  // Chiều rộng mong muốn (pixels)
	Height int  // Chiều cao mong muốn (pixels)
	Crop   bool // Có tự động cắt (crop) tỉ lệ chuẩn hay không
}

// Processor là giao diện xử lý tối ưu hóa hình ảnh (nén, đổi định dạng sang WebP, thay đổi kích thước)
type Processor interface {
	Process(input io.Reader, opts *ResizeOptions) (io.Reader, error)
}

// NoopProcessor là bộ xử lý mặc định (Pass-through): giữ nguyên luồng ảnh gốc mà không thay đổi gì
// Dùng làm điểm nối mở rộng (extension point) khi cần kích hoạt WebP/Imaging sau này
type NoopProcessor struct{}

// NewImageProcessor khởi tạo bộ xử lý hình ảnh
func NewImageProcessor() *NoopProcessor {
	return &NoopProcessor{}
}

// Process trả về chính xác luồng dữ liệu ban đầu
func (p *NoopProcessor) Process(
	input io.Reader,
	opts *ResizeOptions,
) (io.Reader, error) {
	return input, nil
}
