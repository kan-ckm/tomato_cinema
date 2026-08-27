import { registerAs } from '@nestjs/config'
import { validateEnv } from 'src/shared/utils'
import { GrpcUserConfig } from '../interfaces'
import { GrpcUserValidator } from '../validators'

export const grpcUserEnv = registerAs<GrpcUserConfig>('grpc_user', () => {
	const validatedConfig = validateEnv(process.env, GrpcUserValidator)

	return {
		user_host: validatedConfig.GRPC_USER_HOST,
		user_port: validatedConfig.GRPC_USER_PORT,
		url: `${validatedConfig.GRPC_USER_HOST}:${validatedConfig.GRPC_USER_PORT}`
	}
})
