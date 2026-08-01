import { registerAs } from '@nestjs/config'
import { RedisConfig } from 'config/interfaces'
import { RedisValidator } from 'config/validators'
import { validateEnv } from '@/shared/utils/env'

export const redisEnv = registerAs<RedisConfig>('redis', () => {
	validateEnv(process.env, RedisValidator)

	return {
		user: process.env.REDIS_USER,
		password: process.env.REDIS_PASSWORD,
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT)
	}
})
