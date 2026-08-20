import { Injectable } from '@nestjs/common'
import { otpRequestedEvent } from '@tomatocinema/contracts'
import { MailService } from 'src/infrastucture/mail/mail.service'
import { SmsService } from 'src/infrastucture/sms/sms.service'

@Injectable()
export class NotificationsService {
	public constructor(
		private readonly mailService: MailService,
		private readonly smsService: SmsService
	) {}

	public async sendOtp(data: otpRequestedEvent) {
		const { identifier, code, type } = data
		console.log(`OTP event received: `, data)

		if (data.type === 'email') {
			await this.mailService.sendOtp(identifier, code)
		} else {
			this.smsService.sendOtp(identifier, code)
		}
	}
}
