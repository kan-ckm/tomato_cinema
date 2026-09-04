import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AllConfigs } from 'src/config'
import { grpcLoader, grpcPackages, grpcProtoPaths } from './grpc-options'

export function createGrpcServer(
	app: INestApplication,
	config: ConfigService<AllConfigs>
) {
	const url = config.get('grpc_user.url', { infer: true })
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
