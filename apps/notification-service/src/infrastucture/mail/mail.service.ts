import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class MailService {
	public constructor(private readonly transporter: MailerService) {}

	public async sendOtp(email: string, code: string) {
		const html = `<h1>Tomato Cinema</h1>
<p>Ma OTP cua ban la: ${code}</p>
<p>Ma OTP nay se het han sau 10 phut</p>`

		await this.transporter.sendMail({
			to: email,
			subject: 'Tomato Cinema - Xác thực OTP',
			text: html
		})
	}
}
