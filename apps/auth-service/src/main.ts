import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { createGrpcServer } from './infrastructure/grpc/grpc.server'
import './observability/tracking'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true })
	app.useLogger(app.get(Logger))

	const config = app.get(ConfigService)
	createGrpcServer(app, config)

	await app.startAllMicroservices()
	await app.listen(9101)

	const logger = app.get(Logger)
	logger.log(`🚀 gRPC Auth Server is running on port 50051`)
	logger.log(`📊 Metrics endpoint available at http://localhost:9101/metrics`)
}
bootstrap()
