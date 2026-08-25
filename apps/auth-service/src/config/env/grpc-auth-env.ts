import { registerAs } from '@nestjs/config'
import { validateEnv } from '@/shared/utils/env'
import { GrpcAuthConfig } from '../interfaces'
import { GrpcAuthValidator } from '../validators'

export const grpcAuthEnv = registerAs<GrpcAuthConfig>('grpc_auth', () => {
	const validatedConfig = validateEnv(process.env, GrpcAuthValidator)

	return {
		auth_host: validatedConfig.GRPC_AUTH_HOST,
		auth_port: validatedConfig.GRPC_AUTH_PORT
	}
})
