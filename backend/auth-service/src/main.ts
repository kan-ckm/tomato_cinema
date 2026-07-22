import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	//khai báo cổng máy chủ Grpc và thiết lập sử dụng đúng bản hợp đồng auth.proto
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.GRPC,
		options: {
			package: 'auth.v1',
			protoPath: 'node_modules/@tomatocinema/contracts/proto/auth.proto',
			url: 'localhost:50051',
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
