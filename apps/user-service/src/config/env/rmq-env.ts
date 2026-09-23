import { registerAs } from '@nestjs/config'
import { validateEnv } from 'src/shared/utils/env'
import { RmqConfig } from '../interfaces/rmq-interface'
import { RmqValidator } from '../validators/rmq-validator'

export const rmqEnv = registerAs<RmqConfig>('rmq', () => {
	const validatedConfig = validateEnv(process.env, RmqValidator)

	return {
		url: validatedConfig.RMQ_URL,
		queue: validatedConfig.RMQ_QUEUE || 'users_queue'
	}
})
