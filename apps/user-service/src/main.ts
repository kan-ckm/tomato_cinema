import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { AllConfigs } from './config'
import { createGrpcServer } from './infrastructure/grpc/grpc.server'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const config = app.get<ConfigService<AllConfigs, true>>(ConfigService)
	createGrpcServer(app, config)

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [config.getOrThrow<string>('rmq.url', { infer: true })],
			queue:
				config.get<string>('rmq.queue', { infer: true }) ||
				'users_queue',
			queueOptions: {
				durable: true
			},
			noAck: false,
			prefetchCount: 1,
			persistent: true
		}
	})

	await app.startAllMicroservices()
	await app.init()
}
bootstrap()
