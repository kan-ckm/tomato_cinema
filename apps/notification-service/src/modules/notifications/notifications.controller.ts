import { Controller, Logger } from '@nestjs/common'
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import type {
	EmailChangedEvent,
	otpRequestedEvent,
	PasswordChangedEvent,
	PasswordResetRequestedEvent,
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
		private readonly eventTotal: Counter<string>
	) {
		this.SERVICE_NAME = 'notification-service'
	}

	@EventPattern('auth.password_reset.requested')
	public async passwordResetRequested(
		@Payload() data: PasswordResetRequestedEvent,
		@Ctx() ctx: RmqContext
	) {
		const event = 'auth.password_reset.requested'

		const endTimer = this.processingDuration.startTimer({
			service: this.SERVICE_NAME,
			event
		})
		try {
			await this.notificationsService.sendPasswordReset(data)

			this.eventTotal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'success'
			})

			this.rmqService.ack(ctx, event)
		} catch (error: any) {
			this.eventTotal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'error'
			})

			this.logger.error(
				'Password reset email error',
				error.message ?? error
			)
			this.rmqService.nack(ctx, event)
		} finally {
			endTimer()
		}
	}

	@EventPattern('auth.password.changed')
	public async passwordChanged(
		@Payload() data: PasswordChangedEvent,
		@Ctx() ctx: RmqContext
	) {
		const event = 'auth.password.changed'

		const endTimer = this.processingDuration.startTimer({
			service: this.SERVICE_NAME,
			event
		})
		try {
			await this.notificationsService.sendPasswordChanged(data)

			this.eventTotal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'success'
			})

			this.rmqService.ack(ctx, event)
		} catch (error: any) {
			this.eventTotal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'error'
			})

			this.logger.error(
				'Password changed notification error',
				error.message ?? error
			)
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
			this.eventTotal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'success'
			})
			this.rmqService.ack(ctx, event)
		} catch (error: any) {
			this.eventTotal.inc({
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

			this.eventTotal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'success'
			})
			this.rmqService.ack(ctx, event)
		} catch (error: any) {
			this.eventTotal.inc({
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

	/**
	 * @deprecated Giữ lại tương thích nếu có sự kiện cũ
	 */
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
			this.eventTotal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'success'
			})

			this.rmqService.ack(ctx, event)
		} catch (error: any) {
			this.eventTotal.inc({
				service: this.SERVICE_NAME,
				event,
				status: 'error'
			})
			this.logger.error('OTP processing error', error.message ?? error)

			this.rmqService.nack(ctx, event)
		} finally {
			endTimer()
		}
	}
}
