import { Controller, Logger } from '@nestjs/common'
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import type { EmailChangedEvent, otpRequestedEvent, PhoneChangedEvent } from '@tomatocinema/contracts'
import { RmqService } from 'src/infrastucture/rmq/rmq.service'
import { NotificationsService } from './notifications.service'

@Controller()
export class NotificationsController {
	private readonly logger = new Logger(NotificationsController.name)
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
			this.logger.error('OTP processing error', error.message ?? error)

			this.rmqService.nack(ctx)
		}
	}

	@EventPattern('account.phone.changed')
	public async phoneChanged(
		@Payload() data: PhoneChangedEvent,
		@Ctx() ctx: RmqContext
	) {
		try {
			await this.notificationsService.sendPhoneChanged(data)
			this.rmqService.ack(ctx)
		} catch (error) {
			this.logger.error('OTP processing error', error.message ?? error)

			this.rmqService.nack(ctx)
		}
	}
}
