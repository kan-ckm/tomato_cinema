import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AllConfigs } from '@/config'
import { grpcLoader, grpcPackages, grpcProtoPaths } from './grpc-options'

export function createGrpcServer(
	app: INestApplication,
	config: ConfigService<AllConfigs>
) {
	const url = config.get('grpc_auth.url', { infer: true })
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
