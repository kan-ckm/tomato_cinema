import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import './observability/tracking'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const config = app.get(ConfigService)

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [config.get('rmq.url')],
			queue: config.get('rmq.queue'),
			queueOptions: {
				durable: true
			},
			noAck: false,
			prefetchCount: 1,
			persistent: true
		}
	})

	await app.startAllMicroservices()
	await app.listen(9102)
}
bootstrap()
