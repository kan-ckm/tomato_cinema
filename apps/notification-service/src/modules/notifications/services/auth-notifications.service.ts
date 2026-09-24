import { Injectable } from '@nestjs/common'
import type {
	otpRequestedEvent,
	PasswordChangedEvent,
	PasswordResetRequestedEvent
} from '@tomatocinema/contracts'
import { MailService } from 'src/infrastructure/mail/mail.service'
import { SmsService } from 'src/infrastructure/sms/sms.service'

@Injectable()
export class AuthNotificationsService {
	public constructor(
		private readonly mailService: MailService,
		private readonly smsService: SmsService
	) {}

	public async sendPasswordReset(
		data: PasswordResetRequestedEvent
	): Promise<void> {
		const { email, code, expiresInMinutes } = data
		await this.mailService.sendPasswordReset(email, code, expiresInMinutes)
	}

	public async sendPasswordChanged(
		data: PasswordChangedEvent
	): Promise<void> {
		const { email } = data
		await this.mailService.sendPasswordChanged(email)
	}

	/**
	 * @deprecated OTP auth đã được thay thế bằng mật khẩu và password reset
	 */
	public async sendOtp(data: otpRequestedEvent): Promise<void> {
		const { identifier, code } = data

		if (data.type === 'email') {
			await this.mailService.sendOtp(identifier, code)
		} else {
			await this.smsService.sendOtp(identifier, code)
		}
	}
}
