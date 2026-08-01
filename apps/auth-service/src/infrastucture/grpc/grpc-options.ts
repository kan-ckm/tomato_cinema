import { GrpcOptions } from '@nestjs/microservices'
import { PROTO_PATHS } from '@tomatocinema/contracts'

export const grpcPackages = ['auth.v1']

export const grpcProtoPaths = [PROTO_PATHS.AUTH]

export const grpcLoader: NonNullable<GrpcOptions['options']['loader']> = {
	keepCase: false,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true
}
