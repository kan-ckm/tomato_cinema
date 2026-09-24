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
	private readonly SERVICE_NAME = 'notification-service'
	private readonly logger = new Logger(RmqMetricsAckInterceptor.name)

	public constructor(
		private readonly rmqService: RmqService,
		@InjectMetric('rmq_event_processing_duration_seconds')
		private readonly processingDuration: Histogram<string>,
		@InjectMetric('rmq_events_total')
		private readonly eventTotal: Counter<string>
	) {}

	public intercept(
		context: ExecutionContext,
		next: CallHandler
	): Observable<any> {
		if (context.getType() !== 'rpc') {
			return next.handle()
		}

		const rpcContext = context.switchToRpc()
		const rmqContext = rpcContext.getContext<RmqContext>()
		const pattern = rmqContext?.getPattern
			? rmqContext.getPattern()
			: 'unknown'

		const endTimer = this.processingDuration.startTimer({
			service: this.SERVICE_NAME,
			event: pattern
		})

		return next.handle().pipe(
			tap(() => {
				this.eventTotal.inc({
					service: this.SERVICE_NAME,
					event: pattern,
					status: 'success'
				})
				this.rmqService.ack(rmqContext, pattern)
			}),
			catchError((error: unknown) => {
				this.eventTotal.inc({
					service: this.SERVICE_NAME,
					event: pattern,
					status: 'error'
				})
				const errorMessage =
					error instanceof Error ? error.message : String(error)
				const errorStack =
					error instanceof Error ? error.stack : undefined
				this.logger.error(
					`Lỗi xử lý sự kiện [${pattern}]: ${errorMessage}`,
					errorStack
				)
				this.rmqService.nack(rmqContext, pattern, false)
				return of(null)
			}),
			finalize(() => {
				endTimer()
			})
		)
	}
}
