import { Injectable, Logger } from '@nestjs/common'
import { RmqContext } from '@nestjs/microservices'

/**
 * Service tiện ích hỗ trợ xác nhận (ack/nack) tin nhắn thủ công từ RabbitMQ
 */
@Injectable()
export class RmqService {
	private readonly logger = new Logger(RmqService.name)

	/**
	 * Xác nhận tin nhắn đã xử lý thành công (ACK).
	 * RabbitMQ sẽ tiến hành xóa tin nhắn này khỏi hàng đợi.
	 *
	 * @param context Ngữ cảnh RabbitMQ từ NestJS microservice (@Ctx())
	 */
	public ack(context: RmqContext): void {
		const channel = context.getChannelRef()
		const msg = context.getMessage()
		const tag = msg.fields.deliveryTag

		if (!tag) return

		// Xác nhận đã nhận và xử lý tin nhắn
		channel.ack(msg)

		this.logger.debug(`ACK(pattern:${context.getPattern()}, tag: ${tag})`)
	}

	/**
	 * Báo tin nhắn xử lý thất bại (NACK).
	 *
	 * @param context Ngữ cảnh RabbitMQ từ NestJS microservice (@Ctx())
	 * @param requeue Nếu true: đưa tin nhắn về lại queue để xử lý lại; nếu false: hủy/bỏ qua tin nhắn
	 */
	public nack(context: RmqContext, requeue = false): void {
		const channel = context.getChannelRef()
		const msg = context.getMessage()
		const tag = msg.fields.deliveryTag

		if (!tag) return

		// Báo từ chối tin nhắn (allUpTo: false, requeue: boolean)
		channel.nack(msg, false, requeue)

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
