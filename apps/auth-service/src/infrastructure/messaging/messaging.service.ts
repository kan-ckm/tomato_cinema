import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import {
	EmailChangedEvent,
	otpRequestedEvent,
	PasswordChangedEvent,
	PasswordResetRequestedEvent,
	PhoneChangedEvent
} from '@tomatocinema/contracts'

@Injectable()
export class MessagingService {
	public constructor(
		@Inject('NOTIFICATIONS_CLIENT') private readonly client: ClientProxy
	) {}

	public async passwordResetRequested(data: PasswordResetRequestedEvent) {
		return this.client.emit('auth.password_reset.requested', data)
	}

	public async passwordChanged(data: PasswordChangedEvent) {
		return this.client.emit('auth.password.changed', data)
	}

	public async phoneChanged(data: PhoneChangedEvent) {
		return this.client.emit('account.phone.changed', data)
	}

	public async emailChanged(data: EmailChangedEvent) {
		return this.client.emit('account.email.changed', data)
	}

	/**
	 * @deprecated Xác thực OTP đã được gỡ bỏ khỏi auth
	 */
	public async otpRequested(data: otpRequestedEvent) {
		return this.client.emit('auth.otp.requested', data)
	}
}
