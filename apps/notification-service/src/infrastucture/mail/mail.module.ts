import { MailerModule } from '@nestjs-modules/mailer'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getMailerConfig } from 'src/config/factories'
import { MailService } from './mail.service'
import { TemplateService } from './template.service'

@Global()
@Module({
	imports: [
		MailerModule.forRootAsync({
			useFactory: getMailerConfig,
			inject: [ConfigService]
		})
	],
	providers: [MailService, TemplateService],
	exports: [MailService, TemplateService]
})
export class MailModule {}
