import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'
import { TemplateService } from './template.service'

@Injectable()
export class MailService {
	public constructor(
		private readonly transporter: MailerService,
		private readonly templateService: TemplateService
	) {}

	public async sendOtp(email: string, code: string) {
		const html = await this.templateService.render('otp', { code })

		await this.transporter.sendMail({
			to: email,
			subject: 'Tomato Cinema - Xác thực OTP',
			html: html
		})
	}

	public async sendEmailChange(email: string, code: string) {
		const html = await this.templateService.render('email-changed', {
			code
		})

		await this.transporter.sendMail({
			to: email,
			subject: 'Tomato Cinema - Thay đổi email',
			html: html
		})
	}
}
