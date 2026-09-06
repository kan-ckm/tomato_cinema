import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'
import { TemplateService } from './template.service'

@Injectable()
export class MailService {
	public constructor(
		private readonly transporter: MailerService,
		private readonly templateService: TemplateService
	) {}

	public async sendPasswordReset(
		email: string,
		code: string,
		expiresInMinutes: number
	) {
		const html = await this.templateService.render('password-reset', {
			code,
			expiresInMinutes
		})

		await this.transporter.sendMail({
			to: email,
			subject: 'Tomato Cinema - Đặt lại mật khẩu',
			html: html
		})
	}

	public async sendPasswordChanged(email: string) {
		const html = await this.templateService.render('password-changed', {})

		await this.transporter.sendMail({
			to: email,
			subject: 'Tomato Cinema - Mật khẩu của bạn đã được thay đổi',
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

	/**
	 * @deprecated OTP auth đã được thay thế bằng mật khẩu và password reset
	 */
	public async sendOtp(email: string, code: string) {
		const html = await this.templateService.render('otp', { code })

		await this.transporter.sendMail({
			to: email,
			subject: 'Tomato Cinema - Xác thực OTP',
			html: html
		})
	}
}
