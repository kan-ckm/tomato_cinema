import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './config/configuration'
import { RmqModule } from './infrastucture/rmq/rmq.module'
import { NotificationsModule } from './modules/notifications/notifications.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			expandVariables: true
		}),
		RmqModule,
		NotificationsModule
	]
})
export class AppModule {}
