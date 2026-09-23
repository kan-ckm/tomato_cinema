import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
	AccountRegisteredEvent,
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
		@Inject('NOTIFICATIONS_CLIENT_RMQ')
		private readonly notificationsClient: ClientProxy,
		@Inject('USERS_CLIENT_RMQ') private readonly usersClientRmq: ClientProxy
	) {
		this.logger.setContext(MessagingService.name)
	}

	public async accountRegistered(data: AccountRegisteredEvent) {
		this.logger.info(
			{ accountId: data.accountId, email: data.email },
			'Phát sự kiện RabbitMQ: auth.account.registered'
		)
		return this.usersClientRmq.emit('auth.account.registered', data)
	}

	public async passwordResetRequested(data: PasswordResetRequestedEvent) {
		this.logger.info(
			{ email: data.email },
			'Phát sự kiện RabbitMQ: auth.password_reset.requested'
		)
		return this.notificationsClient.emit(
			'auth.password_reset.requested',
			data
		)
	}

	public async passwordChanged(data: PasswordChangedEvent) {
		this.logger.info(
			{ email: data.email },
			'Phát sự kiện RabbitMQ: auth.password.changed'
		)
		return this.notificationsClient.emit('auth.password.changed', data)
	}

	public async phoneChanged(data: PhoneChangedEvent) {
		this.logger.info(
			{ phone: data.phone },
			'Phát sự kiện RabbitMQ: account.phone.changed'
		)
		return this.notificationsClient.emit('account.phone.changed', data)
	}

	public async emailChanged(data: EmailChangedEvent) {
		this.logger.info(
			{ email: data.email },
			'Phát sự kiện RabbitMQ: account.email.changed'
		)
		return this.notificationsClient.emit('account.email.changed', data)
	}

	/**
	 * Phát sự kiện yêu cầu gửi mã OTP (dùng cho xác thực email khi đăng ký, đổi mật khẩu...)
	 */
	public async otpRequested(data: otpRequestedEvent) {
		this.logger.info(
			{ identifier: data.identifier, type: data.type },
			'Phát sự kiện RabbitMQ: auth.otp.requested'
		)
		return this.notificationsClient.emit('auth.otp.requested', data)
	}
}
