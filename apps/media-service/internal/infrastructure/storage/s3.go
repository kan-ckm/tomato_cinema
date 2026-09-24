package storage

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3Types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/tomatocinema/media-service/internal/config"
	"github.com/tomatocinema/media-service/pkg/logger"
)

// S3Storage triển khai giao diện Storage dựa trên AWS S3 SDK v2:
// Hỗ trợ cả AWS S3 thật, MinIO chạy local, Cloudflare R2 hoặc Ceph Object Storage
type S3Storage struct {
	client     *s3.Client          // Client S3 API chính
	uploader   *manager.Uploader   // Trình quản lý upload stream tối ưu phân mảnh
	downloader *manager.Downloader // Trình quản lý download phân đoạn
	bucket     string              // Tên bucket lưu trữ
	cfg        *config.Config      // Cấu hình chung
	presigner  *s3.PresignClient   // Client tạo URL tạm thời có chữ ký (Presigned URL)
}

// NewS3Storage khởi tạo kết nối đến S3/MinIO:
// 1. Cấu hình Credentials và Region
// 2. Bật Path-Style (`UsePathStyle = true`) để tương thích hoàn toàn với MinIO
// 3. Tự động kiểm tra (`HeadBucket`) và tạo Bucket mới (`CreateBucket`) nếu chưa có
func NewS3Storage(c *config.Config) (*S3Storage, error) {
	var loadOpts []func(*awsConfig.LoadOptions) error
	if c.Storage.Region != "" {
		loadOpts = append(loadOpts, awsConfig.WithRegion(c.Storage.Region))
	}
	if c.Storage.AccessKey != "" && c.Storage.SecretKey != "" {
		loadOpts = append(loadOpts, awsConfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(c.Storage.AccessKey, c.Storage.SecretKey, ""),
		))
	}

	awsCfg, err := awsConfig.LoadDefaultConfig(context.Background(), loadOpts...)
	if err != nil {
		return nil, fmt.Errorf("tải cấu hình AWS thất bại: %w", err)
	}

	var clientOpts []func(*s3.Options)
	if strings.TrimSpace(c.Storage.Endpoint) != "" {
		ep := c.Storage.Endpoint

		clientOpts = append(clientOpts, func(o *s3.Options) {
			// Bắt buộc bật UsePathStyle cho MinIO để đường dẫn là http://minio:9000/bucket thay vì bucket.minio:9000
			o.UsePathStyle = true
			o.BaseEndpoint = aws.String(ep)
		})
	}

	client := s3.NewFromConfig(awsCfg, clientOpts...)
	uploader := manager.NewUploader(client)
	downloader := manager.NewDownloader(client)
	presigner := s3.NewPresignClient(client)

	s := &S3Storage{
		client:     client,
		uploader:   uploader,
		downloader: downloader,
		bucket:     c.Storage.Bucket,
		cfg:        c,
		presigner:  presigner,
	}

	// Tự động kiểm tra và khởi tạo Bucket nếu chưa tồn tại
	ctx := context.Background()
	_, headErr := s.client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: aws.String(s.bucket)})
	if headErr != nil {
		_, createErr := s.client.CreateBucket(ctx, &s3.CreateBucketInput{
			Bucket: aws.String(s.bucket),
			CreateBucketConfiguration: &s3Types.CreateBucketConfiguration{
				LocationConstraint: s3Types.BucketLocationConstraint(aws.ToString(&c.Storage.Region)),
			},
		})
		if createErr != nil {
			return nil, fmt.Errorf("khởi tạo bucket thất bại: %w (lỗi kiểm tra: %v)", createErr, headErr)
		}
		logger.Info("🪣 Đã tự động tạo S3 bucket: %s", s.bucket)
	}

	logger.Info("✅ Đã kết nối S3 bucket: %s (vùng=%s)", s.bucket, c.Storage.Region)
	return s, nil
}

// UploadStream tải lên luồng dữ liệu (io.Reader) trực tiếp vào S3/MinIO
func (s *S3Storage) UploadStream(
	ctx context.Context,
	key string,
	reader io.Reader,
	contentType string,
) error {
	_, err := s.uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        reader,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("tải lên S3 thất bại: %w", err)
	}

	return nil
}

// GetStream lấy luồng đọc tệp tin (Body) và ContentType từ S3
func (s *S3Storage) GetStream(
	ctx context.Context,
	key string,
) (io.ReadCloser, string, error) {
	out, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, "", fmt.Errorf("lấy tệp từ S3 thất bại: %w", err)
	}

	contentType := ""
	if out.ContentType != nil {
		contentType = *out.ContentType
	}

	return out.Body, contentType, nil
}

// Delete xóa tệp tin tương ứng với key khỏi bucket S3
func (s *S3Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("xóa tệp từ S3 thất bại: %w", err)
	}
	return nil
}

// GetPublicURL sinh đường dẫn công khai dựa trên HTTP_HOST để client xem ảnh trực tiếp qua Gin Server
func (s *S3Storage) GetPublicURL(key string) string {
	host := s.cfg.HTTP.Host

	if !strings.HasPrefix(host, "http://") && !strings.HasPrefix(host, "https://") {
		host = "http://" + host
	}

	return fmt.Sprintf("%s/%s", strings.TrimRight(host, "/"), key)
}

// GetPresignedURL sinh liên kết tạm có chữ ký với thời hạn expire (GET: xem tạm, PUT: client tự upload trực tiếp lên S3)
func (s *S3Storage) GetPresignedURL(ctx context.Context, key string, expire time.Duration, method string) (string, error) {
	switch strings.ToUpper(method) {
	case "GET":
		ps, err := s.presigner.PresignGetObject(ctx, &s3.GetObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(key),
		}, s3.WithPresignExpires(expire))
		if err != nil {
			return "", fmt.Errorf("tạo presign GET thất bại: %w", err)
		}
		return ps.URL, nil
	case "PUT":
		ps, err := s.presigner.PresignPutObject(ctx, &s3.PutObjectInput{
			Bucket: aws.String(s.bucket),
			Key:    aws.String(key),
		}, s3.WithPresignExpires(expire))
		if err != nil {
			return "", fmt.Errorf("tạo presign PUT thất bại: %w", err)
		}
		return ps.URL, nil
	default:
		return "", fmt.Errorf("phương thức không được hỗ trợ cho presign: %s", method)
	}
}

// Close giải phóng tài nguyên khi tắt service
func (s *S3Storage) Close() error {
	return nil
}

// ensureEndpointURL đảm bảo định dạng URL endpoint có scheme http:// hoặc https://
func ensureEndpointURL(ep string, ssl bool) string {
	ep = strings.TrimSpace(ep)
	if strings.HasPrefix(ep, "http://") || strings.HasPrefix(ep, "https://") {
		return ep
	}
	if ssl {
		return "https://" + ep
	}
	return "http://" + ep
}
