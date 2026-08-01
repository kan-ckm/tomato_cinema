import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AllConfig } from 'config/interfaces'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	const config = app.get(ConfigService<AllConfig>)
	const host = config.get('grpc.host', { infer: true })
	const port = config.get('grpc.port', { infer: true })
	const url = `${host}:${port}`
	//khai báo cổng máy chủ Grpc auth và thiết lập sử dụng đúng bản hợp đồng auth.proto
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.GRPC,
		options: {
			package: 'auth.v1',
			protoPath: 'node_modules/@tomatocinema/contracts/proto/auth.proto',
			url: url,
			loader: {
				keepCase: false,
				longs: String,
				enums: String,
				default: true,
				oneofs: true
			}
		}
	})
	await app.startAllMicroservices()
	await app.init()
}
bootstrap()
