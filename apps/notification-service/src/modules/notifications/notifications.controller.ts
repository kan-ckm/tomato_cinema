import { Controller } from '@nestjs/common'
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import type { otpRequestedEvent } from '@tomatocinema/contracts'
import { RmqService } from 'src/infrastucture/rmq/rmq.service'
import { NotificationsService } from './notifications.service'

@Controller()
export class NotificationsController {
	public constructor(
		private readonly rmqService: RmqService,
		private readonly notificationsService: NotificationsService
	) {}

	@EventPattern('auth.otp.requested')
	public async otpRequested(
		@Payload() data: otpRequestedEvent,
		@Ctx() ctx: RmqContext
	) {
		try {
			await this.notificationsService.sendOtp(data)
			this.rmqService.ack(ctx)
		} catch (error) {
			console.log('OTP processing error', error.getMessage ?? error)

			this.rmqService.nack(ctx)
		}
	}
}
