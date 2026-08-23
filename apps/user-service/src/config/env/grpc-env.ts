import { registerAs } from '@nestjs/config'
import { validateEnv } from 'src/shared/utils'
import { GrpcConfig } from '../interfaces'
import { GrpcValidator } from '../validators'

export const grpcEnv = registerAs<GrpcConfig>('grpc', () => {
	const validatedConfig = validateEnv(process.env, GrpcValidator)

	return {
		host: validatedConfig.GRPC_HOST,
		port: validatedConfig.GRPC_PORT
	}
})
