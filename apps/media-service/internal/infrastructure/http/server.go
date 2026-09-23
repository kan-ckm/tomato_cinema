package http

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/gabriel-vasile/mimetype"
	"github.com/gin-gonic/gin"
	"github.com/teacinema/media-service/internal/config"
	"github.com/teacinema/media-service/internal/infrastructure/images"
	"github.com/teacinema/media-service/internal/infrastructure/storage"
	"github.com/teacinema/media-service/pkg/logger"
)

// Server quản lý HTTP Server (Gin framework) phục vụ truy xuất tệp tin công khai
type Server struct {
	engine    *gin.Engine      // Gin router
	storage   storage.Storage  // Adapter lưu trữ S3/MinIO
	cfg       *config.Config   // Cấu hình ứng dụng
	processor images.Processor // Bộ xử lý ảnh
	httpSrv   *http.Server     // HTTP Server tiêu chuẩn của Go
}

// NewServer khởi tạo Gin HTTP Server:
// - Đăng ký middleware Logger và Recovery
// - Thiết lập endpoint GET /*key phục vụ tải/xem ảnh trực tiếp
func NewServer(s storage.Storage, cfg *config.Config) *Server {
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	srv := &Server{
		engine:  r,
		storage: s,
		cfg:     cfg,
	}

	// Đăng ký route phục vụ media công khai: ví dụ GET /posters/avengers.webp
	r.GET("/*key", srv.getMediaHandler)

	srv.httpSrv = &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.HTTP.Port),
		Handler: r,
	}

	return srv
}

// Start khởi chạy HTTP server lắng nghe request
func (s *Server) Start() error {
	return s.httpSrv.ListenAndServe()
}

// Stop thực hiện dừng HTTP server an toàn với context timeout
func (s *Server) Stop(ctx context.Context) error {
	return s.httpSrv.Shutdown(ctx)
}

// getMediaHandler xử lý request tải/xem media:
// 1. Lấy khóa (key) từ URL (bỏ dấu '/' ở đầu)
// 2. Mở stream đọc trực tiếp từ S3/MinIO
// 3. Tự động nhận diện MIME type thực tế bằng thư viện mimetype
// 4. Gắn header Cache-Control: public, max-age=86400 (cache 24h ở client/CDN)
// 5. Trả dữ liệu nhị phân về cho trình duyệt
func (s *Server) getMediaHandler(c *gin.Context) {
	key := c.Param("key")[1:]

	obj, contentType, err := s.storage.GetStream(c, key)
	if err != nil {
		c.String(http.StatusNotFound, "Tệp tin không tồn tại")
		return
	}
	defer obj.Close()

	img, err := io.ReadAll(obj)
	if err != nil {
		logger.Error("Lỗi đọc luồng dữ liệu tệp tin: %v", err)
		c.String(http.StatusInternalServerError, "Lỗi đọc tệp tin")
		return
	}

	// Phát hiện MIME type thực tế của dữ liệu nhị phân
	mime := mimetype.Detect(img)

	c.Header("Content-Type", contentType)
	c.Header("Cache-Control", "public, max-age=86400")

	c.Data(http.StatusOK, mime.String(), img)
}
