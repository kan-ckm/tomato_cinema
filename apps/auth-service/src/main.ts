import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { createGrpcServer } from './infrastructure/grpc/grpc.server'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	const config = app.get(ConfigService)

	createGrpcServer(app, config)

	await app.startAllMicroservices()
	await app.listen(9101)
	Logger.log(`🚀 gRPC Auth Server is running on port 50051`)
	Logger.log(`📊 Metrics endpoint available at http://localhost:9101/metrics`)
}
bootstrap()
