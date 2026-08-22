import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AllConfigs } from 'config/interfaces'
import { grpcLoader, grpcPackages, grpcProtoPaths } from './grpc-options'

export function createGrpcServer(app: INestApplication, config: ConfigService) {
	const host = config.get('grpc.host', { infer: true })
	const port = config.get('grpc.port', { infer: true })
	const url = `${host}:${port}`
	//khai báo cổng máy chủ Grpc auth và thiết lập sử dụng đúng bản hợp đồng auth.proto
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.GRPC,
		options: {
			package: grpcPackages,
			protoPath: grpcProtoPaths,
			url,
			loader: grpcLoader
		}
	})
}
