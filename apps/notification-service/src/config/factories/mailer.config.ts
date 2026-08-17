import type { MailerOptions } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'
import { config } from 'process'

export function getMailerConfig(configService: ConfigService): MailerOptions {
	return {
		transport: {
			host: configService.get<string>('smtp.host'),
			port: configService.get<number>('smtp.port'),
			auth: {
				user: configService.get<string>('smtp.username'),
				pass: configService.get<string>('smtp.password')
			},
			secure: configService.get('smtp.secure')
		},
		defaults: {
			from: `TomatoCinema ${configService.get('smtp.fromAddress')}`
		}
	}
}
