import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getExolveConfig } from 'src/config/factories'
import { MailModule } from 'src/infrastucture/mail/mail.module'
import { MailService } from 'src/infrastucture/mail/mail.service'
import { SmsModule } from 'src/infrastucture/sms/sms.module'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'

@Module({
	imports: [
		MailModule,
		SmsModule.registerAsync({
			useFactory: getExolveConfig,
			inject: [ConfigService]
		})
	],
	controllers: [NotificationsController],
	providers: [NotificationsService]
})
export class NotificationsModule {}
