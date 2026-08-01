import { registerAs } from '@nestjs/config'
import { GrpcConfig } from 'config/interfaces'
import { GrpcValidator } from 'config/validators'
import { validateEnv } from '@/shared/utils/env'

export const grpcEnv = registerAs<GrpcConfig>('grpc', () => {
	validateEnv(process.env, GrpcValidator)

	return {
		host: process.env.GRPC_HOST,
		port: parseInt(process.env.GRPC_PORT)
	}
})
