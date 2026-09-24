import { Injectable } from '@nestjs/common'
import type {
	EmailChangedEvent,
	PhoneChangedEvent
} from '@tomatocinema/contracts'
import { MailService } from 'src/infrastructure/mail/mail.service'
import { SmsService } from 'src/infrastructure/sms/sms.service'

@Injectable()
export class AccountNotificationsService {
	public constructor(
		private readonly mailService: MailService,
		private readonly smsService: SmsService
	) {}

	public async sendEmailChange(data: EmailChangedEvent): Promise<void> {
		const { email, code } = data
		await this.mailService.sendEmailChange(email, code)
	}

	public async sendPhoneChange(data: PhoneChangedEvent): Promise<void> {
		const { phone, code } = data
		await this.smsService.sendPhoneChanged(phone, code)
	}
}
