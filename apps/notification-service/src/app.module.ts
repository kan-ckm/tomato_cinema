import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './config/configuration'
import { MailModule } from './infrastructure/mail/mail.module'
import { RmqModule } from './infrastructure/rmq/rmq.module'
import { SmsModule } from './infrastructure/sms/sms.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { ObservabilityModule } from './observability/observability.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			expandVariables: true
		}),
		RmqModule,
		NotificationsModule,
		MailModule,
		SmsModule,
		ObservabilityModule
	]
})
export class AppModule {}
