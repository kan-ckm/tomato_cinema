import { Injectable } from '@nestjs/common'
import { otpRequestedEvent } from '@tomatocinema/contracts'
import { MailService } from 'src/infrastucture/mail/mail.service'

@Injectable()
export class NotificationsService {
	public constructor(private readonly mailService: MailService) {}

	public async sendOtp(data: otpRequestedEvent) {
		const { identifier, code, type } = data
		console.log(`OTP event received: `, data)

		if (data.type === 'email') {
			await this.mailService.sendOtp(identifier, code)
		} else {
			console.log('SMS')
		}
	}
}
