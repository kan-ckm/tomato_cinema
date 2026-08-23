import { registerAs } from '@nestjs/config'
import { validateEnv } from '@/shared/utils/env'
import { RedisConfig } from '../interfaces'
import { RedisValidator } from '../validators'

export const redisEnv = registerAs<RedisConfig>('redis', () => {
	const validatedConfig = validateEnv(process.env, RedisValidator)

	return {
		user: validatedConfig.REDIS_USER,
		password: validatedConfig.REDIS_PASSWORD,
		host: validatedConfig.REDIS_HOST,
		port: validatedConfig.REDIS_PORT
	}
})
