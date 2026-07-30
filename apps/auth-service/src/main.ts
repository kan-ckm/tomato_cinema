import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	const config = app.get(ConfigService)
	const port_grpc = config.getOrThrow<string>('AUTH_GRPC_URL')
	//khai báo cổng máy chủ Grpc auth và thiết lập sử dụng đúng bản hợp đồng auth.proto
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.GRPC,
		options: {
			package: 'auth.v1',
			protoPath: 'node_modules/@tomatocinema/contracts/proto/auth.proto',
			url: port_grpc,
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
