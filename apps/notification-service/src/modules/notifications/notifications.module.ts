import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getExolveConfig } from 'src/config/factories'
import { MailModule } from 'src/infrastructure/mail/mail.module'
import { SmsModule } from 'src/infrastructure/sms/sms.module'
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
