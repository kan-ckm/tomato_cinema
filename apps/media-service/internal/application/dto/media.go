package dto

import "io"

// UploadMediaRequest chứa dữ liệu yêu cầu tải lên tệp tin đa phương tiện
type UploadMediaRequest struct {
	FileName     string    // Tên tệp gốc (ví dụ: poster.png)
	Folder       string    // Thư mục lưu trữ trên bucket (ví dụ: posters, avatars)
	ContentType  string    // Định dạng MIME (ví dụ: image/png, image/jpeg)
	ResizeWidth  int32     // Chiều rộng mong muốn khi resize (tùy chọn)
	ResizeHeight int32     // Chiều cao mong muốn khi resize (tùy chọn)
	Preset       string    // Mẫu kích thước dựng sẵn (thumbnail, avatar, banner)
	Reader       io.Reader // Luồng dữ liệu nhị phân của tệp
	Size         int64     // Kích thước tệp tính theo bytes
}

// UploadMediaResponse trả về khóa định danh của tệp sau khi lưu trữ thành công
type UploadMediaResponse struct {
	Key string // Khóa đường dẫn trên bucket (ví dụ: posters/poster.png)
}

// GetMediaRequest yêu cầu lấy tệp tin theo khóa định danh
type GetMediaRequest struct {
	Key string // Khóa đường dẫn tệp trên storage
}

// GetMediaResponse trả về luồng dữ liệu tệp và Content-Type
type GetMediaResponse struct {
	Reader      io.ReadCloser // Luồng đọc dữ liệu từ storage (cần được Close sau khi đọc xong)
	ContentType string        // Loại nội dung của tệp
}

// DeleteMediaRequest yêu cầu xóa tệp tin khỏi bộ lưu trữ
type DeleteMediaRequest struct {
	Key string // Khóa đường dẫn tệp cần xóa
}

// DeleteMediaResponse kết quả thao tác xóa tệp
type DeleteMediaResponse struct {
	OK bool // true nếu thao tác xóa thành công
}
