import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AllConfigs } from 'config/interfaces/all-configs-intertface'
import { MessagingService } from './messaging.service'

@Global()
@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'NOTIFICATIONS_CLIENT',
				inject: [ConfigService],
				useFactory: (configService: ConfigService<AllConfigs>) => ({
					transport: Transport.RMQ,
					options: {
						urls: [
							configService.getOrThrow<string>('rmq.url', {
								infer: true
							})
						],
						queue: 'notifications_queue',
						queueOptions: {
							durable: true
						}
					}
				})
			}
		])
	],
	providers: [MessagingService],
	exports: [MessagingService]
})
export class MessagingModule {}
