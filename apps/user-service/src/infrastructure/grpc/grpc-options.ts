import { GrpcOptions } from '@nestjs/microservices'
import { PROTO_PATHS } from '@tomatocinema/contracts'

export const grpcPackages = ['users.v1']

export const grpcProtoPaths = [PROTO_PATHS.USERS]

export const grpcLoader: NonNullable<GrpcOptions['options']['loader']> = {
	keepCase: false,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true
}
