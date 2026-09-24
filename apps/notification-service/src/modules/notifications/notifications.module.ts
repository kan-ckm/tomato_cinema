import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getExolveConfig } from 'src/config/factories'
import { MailModule } from 'src/infrastructure/mail/mail.module'
import { SmsModule } from 'src/infrastructure/sms/sms.module'
import { AccountNotificationsController } from './controllers/account-notifications.controller'
import { AuthNotificationsController } from './controllers/auth-notifications.controller'
import { RmqMetricsAckInterceptor } from './interceptors/rmq-metrics-ack.interceptor'
import { AccountNotificationsService } from './services/account-notifications.service'
import { AuthNotificationsService } from './services/auth-notifications.service'

@Module({
	imports: [
		MailModule,
		SmsModule.registerAsync({
			useFactory: getExolveConfig,
			inject: [ConfigService]
		})
	],
	controllers: [AuthNotificationsController, AccountNotificationsController],
	providers: [
		AuthNotificationsService,
		AccountNotificationsService,
		RmqMetricsAckInterceptor
	],
	exports: [AuthNotificationsService, AccountNotificationsService]
})
export class NotificationsModule {}
