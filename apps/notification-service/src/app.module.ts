import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './config/configuration'
import { MailModule } from './infrastucture/mail/mail.module'
import { RmqModule } from './infrastucture/rmq/rmq.module'
import { SmsModule } from './infrastucture/sms/sms.module'
import { NotificationsModule } from './modules/notifications/notifications.module'

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
		SmsModule
	]
})
export class AppModule {}
