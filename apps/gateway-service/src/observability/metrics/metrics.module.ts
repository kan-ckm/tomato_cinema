import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import {
	makeCounterProvider,
	makeGaugeProvider,
	makeHistogramProvider,
	PrometheusModule
} from '@willsoto/nestjs-prometheus'
import { HttpMetricsInterceptor } from './http-metrics.interceptor'

/**
 *MetricsModule: Quản lý việc thu thập và xuất các chỉ số (Prometheus Metrics).
 *
 * Luồng hoạt động:
 * 1. `PrometheusModule.register()`: Tự động mở endpoint `GET /metrics` trên Gateway Service để Prometheus Server định kỳ vào cào (scrape).
 * 2. Tự động thu thập `defaultMetrics`: Đo CPU, RAM, Heap Memory, Event Loop Lag của tiến trình Node.js.
 * 3. Tạo các Custom Metric Providers thông qua `make...Provider()` để đo riêng cho các HTTP requests.
 * 4. Tự động kích hoạt `HttpMetricsInterceptor` cho toàn bộ các route thông qua `APP_INTERCEPTOR`.
 */
@Module({
	imports: [
		PrometheusModule.register({
			path: '/metrics', // Endpoint để Prometheus cào dữ liệu (VD: http://localhost:4000/metrics)
			defaultMetrics: {
				enabled: true // Bật thu thập metrics hệ thống mặc định (CPU, RAM, Event loop)
			}
		})
	],
	providers: [
		/**
		 * HISTOGRAM: Đo thời gian phản hồi (Latency / Duration) của từng HTTP Request.
		 * Cho phép tính toán độ trễ trung bình, p50, p90, p95, p99 (99% request phản hồi dưới bao nhiêu giây).
		 */
		makeHistogramProvider({
			name: 'http_request_duration_seconds',
			help: 'HTTP request latency in seconds',
			labelNames: ['service', 'method', 'route', 'status'],
			buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
		}),

		/**
		 * Đo số lượng HTTP Request ĐANG ĐƯỢC XỬ LÝ tại thời điểm hiện tại (In-Flight).
		 * Giá trị có thể tăng khi có request đến và giảm khi request xử lý xong.
		 * Giúp phát hiện hệ thống có đang bị tắc nghẽn (dồn ứ request) hay không.
		 */
		makeGaugeProvider({
			name: 'http_request_in_flight',
			help: 'Current number of in-flight HTTP requests',
			labelNames: ['service']
		}),

		/**
		 * OUNTER: Đếm TỔNG SỐ LƯỢNG HTTP Request từ lúc bật server đến nay.
		 * Giá trị này chỉ có tăng lên (hoặc reset về 0 khi restart app).
		 * Giúp tính toán tốc độ Request Per Second (RPS) và tỉ lệ lỗi Error Rate (status 5xx / total).
		 */
		makeCounterProvider({
			name: 'http_request_total',
			help: 'Total number of HTTP requests processed',
			labelNames: ['service', 'method', 'route', 'status']
		}),
		HttpMetricsInterceptor,

		//GLOBAL INTERCEPTOR: Tự động gắn HttpMetricsInterceptor vào tất cả các Request trong app

		{
			provide: APP_INTERCEPTOR,
			useClass: HttpMetricsInterceptor
		}
	]
})
export class MetricsModule {}
