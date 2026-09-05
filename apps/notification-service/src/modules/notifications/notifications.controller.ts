import { Controller, Logger } from '@nestjs/common'
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import type {
	EmailChangedEvent,
	otpRequestedEvent,
	PhoneChangedEvent
} from '@tomatocinema/contracts'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram } from 'prom-client'
import { RmqService } from 'src/infrastructure/rmq/rmq.service'
import { NotificationsService } from './notifications.service'

@Controller()
export class NotificationsController {
	private readonly SERVICE_NAME: string

	private readonly logger = new Logger(NotificationsController.name)
	public constructor(
		private readonly rmqService: RmqService,
		private readonly notificationsService: NotificationsService,

		@InjectMetric('rmq_event_processing_duration_seconds')
		private readonly processingDuration: Histogram<string>,
		@InjectMetric('rmq_events_total')
		private readonly eventToal: Counter<string>
	) {
		this.SERVICE_NAME = 'notification-service'
	}

	@EventPattern('auth.otp.requested')
	public async otpRequested(
		@Payload() data: otpRequestedEvent,
		@Ctx() ctx: RmqContext
	) {
		const event = 'auth.otp.requested'

		const endTimer = this.processingDuration.startTimer({
			service: this.SERVICE_NAME,
			event
		})
		try {
			await this.notificationsService.sendOtp(data)

			this.eventToal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'success'
			})

			this.rmqService.ack(ctx, event)
		} catch (error) {
			this.eventToal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'error'
			})

			this.logger.error('OTP processing error', error.message ?? error)

			this.rmqService.nack(ctx, event)
			throw error
		} finally {
			endTimer()
		}
	}

	@EventPattern('account.phone.changed')
	public async phoneChanged(
		@Payload() data: PhoneChangedEvent,
		@Ctx() ctx: RmqContext
	) {
		const event = 'account.phone.changed'

		const endTimer = this.processingDuration.startTimer({
			service: this.SERVICE_NAME,
			event
		})

		try {
			await this.notificationsService.sendPhoneChange(data)

			this.eventToal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'success'
			})
			this.rmqService.ack(ctx, event)
		} catch (error) {
			this.eventToal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'error'
			})
			this.logger.error('Phone changed error', error.message ?? error)
			this.rmqService.nack(ctx, event)
		} finally {
			endTimer()
		}
	}

	@EventPattern('account.email.changed')
	public async emailChanged(
		@Payload() data: EmailChangedEvent,
		@Ctx() ctx: RmqContext
	) {
		const event = 'account.email.changed'

		const endTimer = this.processingDuration.startTimer({
			service: this.SERVICE_NAME,
			event
		})

		try {
			await this.notificationsService.sendEmailChange(data)
			this.eventToal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'success'
			})
			this.rmqService.ack(ctx, event)
		} catch (error) {
			this.eventToal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'error'
			})
			this.logger.error('Email changed error', error.message ?? error)

			this.rmqService.nack(ctx, event)
		} finally {
			endTimer()
		}
	}
}
