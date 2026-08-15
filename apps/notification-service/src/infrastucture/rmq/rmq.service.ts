import { Injectable, Logger } from '@nestjs/common'
import { RmqContext } from '@nestjs/microservices'

@Injectable()
export class RmqService {
	private readonly logger = new Logger(RmqService.name)

	public ack(context: RmqContext) {
		const channel = context.getChannelRef()
		const msg = context.getMessage()
		const tag = msg.fields.deliveryTag

		if (!tag) return

		channel.ack(msg)

		this.logger.debug(`ACK(pattern:${context.getPattern()}, tag: ${tag})`)
	}

	public nack(context: RmqContext, requeue = false): void {
		const channel = context.getChannelRef()
		const msg = context.getMessage()
		const tag = msg.fields.deliveryTag

		if (!tag) return

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
