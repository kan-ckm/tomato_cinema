import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
	EmailChangedEvent,
	otpRequestedEvent,
	PasswordChangedEvent,
	PasswordResetRequestedEvent,
	PhoneChangedEvent
} from '@tomatocinema/contracts'
import { PinoLogger } from 'nestjs-pino'

@Injectable()
export class MessagingService {
	public constructor(
		private readonly logger: PinoLogger,
		@Inject('NOTIFICATIONS_CLIENT') private readonly client: ClientProxy
	) {
		this.logger.setContext(MessagingService.name)
	}

	public async passwordResetRequested(data: PasswordResetRequestedEvent) {
		this.logger.info(
			{ email: data.email },
			'Phát sự kiện RabbitMQ: auth.password_reset.requested'
		)
		return this.client.emit('auth.password_reset.requested', data)
	}

	public async passwordChanged(data: PasswordChangedEvent) {
		this.logger.info(
			{ email: data.email },
			'Phát sự kiện RabbitMQ: auth.password.changed'
		)
		return this.client.emit('auth.password.changed', data)
	}

	public async phoneChanged(data: PhoneChangedEvent) {
		this.logger.info(
			{ phone: data.phone },
			'Phát sự kiện RabbitMQ: account.phone.changed'
		)
		return this.client.emit('account.phone.changed', data)
	}

	public async emailChanged(data: EmailChangedEvent) {
		this.logger.info(
			{ email: data.email },
			'Phát sự kiện RabbitMQ: account.email.changed'
		)
		return this.client.emit('account.email.changed', data)
	}

	/**
	 * @deprecated Xác thực OTP đã được gỡ bỏ khỏi auth
	 */
	public async otpRequested(data: otpRequestedEvent) {
		return this.client.emit('auth.otp.requested', data)
	}
}
