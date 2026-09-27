/**
 * ============================================================================
 * RmqMetricsAckInterceptor: Bộ đánh chặn (Interceptor) cho RabbitMQ Consumer
 * ============================================================================
 *
 * [TÁC DỤNG & MỤC ĐÍCH]:
 * Áp dụng mô hình AOP (Aspect-Oriented Programming) nhằm bọc quanh luồng xử lý
 * các sự kiện RabbitMQ trong microservice, giải quyết 3 bài toán lớn:
 *
 * 1. TỰ ĐỘNG HÓA VÒNG ĐỜI XÁC NHẬN TIN NHẮN (AUTO ACK/NACK):
 *    - Thành công (tap): Tự động gọi `rmqService.ack()` báo cho RabbitMQ xóa message khỏi queue.
 *    - Thất bại (catchError): Tự động gọi `rmqService.nack(..., requeue = false)` nhằm:
 *      + Ngăn chặn hiện tượng Poison Pill / Infinite Retry Loop (gây nghẽn queue liên tục).
 *      + Message hỏng sẽ bị loại bỏ hoặc tự động chuyển vào Dead Letter Queue (DLQ).
 *
 * 2. THU THẬP CHỈ SỐ METRICS CHO PROMETHEUS (OBSERVABILITY):
 *    - Đo độ trễ xử lý (Histogram: `rmq_event_processing_duration_seconds`) theo từng event.
 *    - Đếm tổng số lượng sự kiện (Counter: `rmq_events_total`) kèm nhãn `status: 'success'` hoặc `'error'`.
 *
 * 3. XỬ LÝ LỖI TẬP TRUNG & BẢO VỆ TIẾN TRÌNH (FAULT TOLERANCE):
 *    - Ghi log lỗi tập trung có đầy đủ context (tên pattern, nội dung lỗi, stack trace).
 *    - Bắt exception bằng `catchError` và trả về `of(null)` giúp worker tiếp tục chạy an toàn,
 *      tránh unhandled exception làm gián đoạn hoặc sập tiến trình NestJS microservice.
 *
 * 4. NGUYÊN LÝ DRY (DON'T REPEAT YOURSELF):
 *    - Giải phóng các Controller handlers khỏi boilerplate code (không cần try-catch lặp lại,
 *      không cần inject RmqContext hay thao tác thủ công với deliveryTag/channel).
 * ============================================================================
 */
import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor
} from '@nestjs/common'
import { RmqContext } from '@nestjs/microservices'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram } from 'prom-client'
import { Observable, of } from 'rxjs'
import { catchError, finalize, tap } from 'rxjs/operators'
import { RmqService } from 'src/infrastructure/rmq/rmq.service'

/**
 * Interceptor tự động đo thời gian Prometheus, cập nhật metrics
 * và tự động thực hiện ACK/NACK tin nhắn RabbitMQ.
 */
@Injectable()
export class RmqMetricsAckInterceptor implements NestInterceptor {
	// Tên định danh microservice dùng làm nhãn (label) gắn vào các metrics Prometheus
	private readonly SERVICE_NAME = 'notification-service'
	private readonly logger = new Logger(RmqMetricsAckInterceptor.name)

	public constructor(
		// Service tiện ích chịu trách nhiệm tương tác trực tiếp với AMQP channel để gửi ack/nack
		private readonly rmqService: RmqService,

		// Metric Histogram: Đo phân phối thời gian thực thi (latency P50/P90/P99) của từng sự kiện
		@InjectMetric('rmq_event_processing_duration_seconds')
		private readonly processingDuration: Histogram<string>,

		// Metric Counter: Đếm lũy kế tổng số sự kiện đã xử lý, phân loại theo trạng thái (success/error)
		@InjectMetric('rmq_events_total')
		private readonly eventTotal: Counter<string>
	) {}

	/**
	 * Đánh chặn quá trình xử lý tin nhắn RabbitMQ từ Controller handler
	 *
	 * @param context Ngữ cảnh thực thi của NestJS (ExecutionContext)
	 * @param next Đối tượng điều khiển chuyển tiếp luồng xử lý (CallHandler)
	 */
	public intercept(
		context: ExecutionContext,
		next: CallHandler
	): Observable<any> {
		// [Bước 1]: Kiểm tra ngữ cảnh thực thi.
		// Nếu không phải là giao tiếp microservice RPC (ví dụ: HTTP thông thường), bỏ qua không can thiệp.
		if (context.getType() !== 'rpc') {
			return next.handle()
		}

		// [Bước 2]: Trích xuất ngữ cảnh RabbitMQ và tên sự kiện (pattern/routing key)
		const rpcContext = context.switchToRpc()
		const rmqContext = rpcContext.getContext<RmqContext>()
		const pattern = rmqContext?.getPattern
			? rmqContext.getPattern()
			: 'unknown'

		// [Bước 3]: Khởi động đồng hồ đo thời gian (Prometheus timer) trước khi handler thực thi
		const endTimer = this.processingDuration.startTimer({
			service: this.SERVICE_NAME,
			event: pattern
		})

		// [Bước 4]: Chuyển quyền xử lý cho Controller handler và can thiệp kết quả thông qua RxJS Pipe
		return next.handle().pipe(
			// --- [Trường hợp 1: XỬ LÝ THÀNH CÔNG] ---
			tap(() => {
				// Cập nhật metric: Tăng biến đếm sự kiện thành công
				this.eventTotal.inc({
					service: this.SERVICE_NAME,
					event: pattern,
					status: 'success'
				})

				// Xác nhận (ACK) với RabbitMQ để xóa tin nhắn khỏi hàng đợi
				this.rmqService.ack(rmqContext, pattern)
			}),

			// --- [Trường hợp 2: GẶP NGOẠI LỆ / THẤT BẠI] ---
			catchError((error: unknown) => {
				// Cập nhật metric: Tăng biến đếm sự kiện thất bại
				this.eventTotal.inc({
					service: this.SERVICE_NAME,
					event: pattern,
					status: 'error'
				})

				// Trích xuất nội dung lỗi và stack trace phục vụ điều tra
				const errorMessage =
					error instanceof Error ? error.message : String(error)
				const errorStack =
					error instanceof Error ? error.stack : undefined

				this.logger.error(
					`Lỗi xử lý sự kiện [${pattern}]: ${errorMessage}`,
					errorStack
				)

				// Gửi tín hiệu từ chối (NACK) với requeue = false:
				// - Tránh vòng lặp vô tận (Poison Pill) làm nghẽn hàng đợi
				// - Đẩy message lỗi vào Dead Letter Queue (DLQ) nếu đã cấu hình
				this.rmqService.nack(rmqContext, pattern, false)

				// Nuốt lỗi an toàn bằng stream chứa null để bảo vệ worker không bị sập (crash)
				return of(null)
			}),

			// --- [Trường hợp 3: HOÀN TẤT VÒNG ĐỜI (LUÔN CHẠY)] ---
			finalize(() => {
				// Dừng đồng hồ đo thời gian và ghi nhận duration vào Prometheus Histogram
				endTimer()
			})
		)
	}
}
