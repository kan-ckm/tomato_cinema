package logger

import (
	"log"
	"os"
	"strings"
)

// level lưu trữ mức độ log hiện tại (mặc định: "info")
var level = "info"

// Init thiết lập mức độ lọc log và cấu hình cờ hiển thị ngày giờ, tên file
func Init(lvl string) {
	level = strings.ToLower(lvl)

	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Printf("[BỘ GHI LOG] Đã khởi tạo với mức độ: %s", level)
}

// Info ghi nhận thông tin luồng hoạt động thông thường
func Info(format string, v ...any) {
	if levelAllowed("info") {
		log.Printf("[THÔNG TIN] "+format, v...)
	}
}

// Warn ghi nhận các cảnh báo bất thường nhưng chưa làm dừng hệ thống
func Warn(format string, v ...any) {
	if levelAllowed("warn") {
		log.Printf("[CẢNH BÁO] "+format, v...)
	}
}

// Error ghi nhận lỗi xảy ra trong quá trình xử lý tác vụ
func Error(format string, v ...any) {
	if levelAllowed("error") {
		log.Printf("[LỖI] "+format, v...)
	}
}

// Fatal ghi nhận lỗi nghiêm trọng và lập tức dừng chương trình (os.Exit(1))
func Fatal(format string, v ...any) {
	log.Printf("[NGHIÊM TRỌNG] "+format, v...)
	os.Exit(1)
}

// levelAllowed kiểm tra xem mức độ log hiện tại có đủ điều kiện để được in ra hay không
func levelAllowed(l string) bool {
	levels := map[string]int{
		"debug": 1,
		"info":  2,
		"warn":  3,
		"error": 4,
		"fatal": 5,
	}

	return levels[strings.ToLower(level)] <= levels[l]
}
