import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { PROTO_PATHS } from '@tomatocinema/contracts'
import { AllConfig } from 'config/interfaces'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	const config = app.get(ConfigService)

	await app.startAllMicroservices()
	await app.init()
}
bootstrap()
