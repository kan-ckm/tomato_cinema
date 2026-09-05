import { Injectable } from '@nestjs/common'
import {
	EmailChangedEvent,
	otpRequestedEvent,
	PasswordChangedEvent,
	PasswordResetRequestedEvent,
	PhoneChangedEvent
} from '@tomatocinema/contracts'
import { MailService } from 'src/infrastructure/mail/mail.service'
import { SmsService } from 'src/infrastructure/sms/sms.service'

@Injectable()
export class NotificationsService {
	public constructor(
		private readonly mailService: MailService,
		private readonly smsService: SmsService
	) {}

	public async sendPasswordReset(data: PasswordResetRequestedEvent) {
		const { email, code, expiresInMinutes } = data
		return await this.mailService.sendPasswordReset(
			email,
			code,
			expiresInMinutes
		)
	}

	public async sendPasswordChanged(data: PasswordChangedEvent) {
		const { email } = data
		return await this.mailService.sendPasswordChanged(email)
	}

	public async sendPhoneChange(data: PhoneChangedEvent) {
		const { phone, code } = data
		return await this.smsService.sendPhoneChanged(phone, code)
	}

	public async sendEmailChange(data: EmailChangedEvent) {
		const { email, code } = data
		return await this.mailService.sendEmailChange(email, code)
	}

	/**
	 * @deprecated OTP auth đã được thay thế
	 */
	public async sendOtp(data: otpRequestedEvent) {
		const { identifier, code } = data

		if (data.type === 'email') {
			await this.mailService.sendOtp(identifier, code)
		} else {
			this.smsService.sendOtp(identifier, code)
		}
	}
}
