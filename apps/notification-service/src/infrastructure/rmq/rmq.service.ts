import { Injectable, Logger } from '@nestjs/common'
import { RmqContext } from '@nestjs/microservices'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter } from 'prom-client'

/**
 * Service tiện ích hỗ trợ xác nhận (ack/nack) tin nhắn thủ công từ RabbitMQ
 */
@Injectable()
export class RmqService {
	private readonly SERVICE_NAME: string

	private readonly logger = new Logger(RmqService.name)
	public constructor(
		@InjectMetric('rmq_events_ack_total')
		private readonly ackTotal: Counter<string>,
		@InjectMetric('rmq_events_nack_total')
		private readonly nackTotal: Counter<string>
	) {
		this.SERVICE_NAME = 'notification-service'
	}
	/**
	 * Xác nhận tin nhắn đã xử lý thành công (ACK).
	 * RabbitMQ sẽ tiến hành xóa tin nhắn này khỏi hàng đợi.
	 *
	 * @param context Ngữ cảnh RabbitMQ từ NestJS microservice (@Ctx())
	 */
	public ack(context: RmqContext, event: string): void {
		const channel = context.getChannelRef()
		const msg = context.getMessage()
		const tag = msg.fields.deliveryTag

		if (!tag) return

		// Xác nhận đã nhận và xử lý tin nhắn
		channel.ack(msg)

		this.ackTotal.inc({
			service: this.SERVICE_NAME,
			event
		})

		this.logger.debug(`ACK(pattern:${context.getPattern()}, tag: ${tag})`)
	}

	/**
	 * Báo tin nhắn xử lý thất bại (NACK).
	 *
	 * @param context Ngữ cảnh RabbitMQ từ NestJS microservice (@Ctx())
	 * @param requeue Nếu true: đưa tin nhắn về lại queue để xử lý lại; nếu false: hủy/bỏ qua tin nhắn
	 */
	public nack(context: RmqContext, event: string, requeue = false): void {
		const channel = context.getChannelRef()
		const msg = context.getMessage()
		const tag = msg.fields.deliveryTag

		if (!tag) return

		// Báo từ chối tin nhắn (allUpTo: false, requeue: boolean)
		channel.nack(msg, false, requeue)

		this.nackTotal.inc({
			service: this.SERVICE_NAME,
			event
		})

		if (requeue) {
			this.logger.warn(
				`NACK(pattern:${context.getPattern()}, tag: ${tag})`
			)
		} else {
			this.logger.error(
				`NACK drop(pattern:${context.getPattern()}, tag: ${tag})`
			)
		}
	}
}
