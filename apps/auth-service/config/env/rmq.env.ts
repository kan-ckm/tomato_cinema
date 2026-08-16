import { registerAs } from '@nestjs/config'
import { RmqConfig } from 'config/interfaces/rmq.interface'
import { RmqValidator } from 'config/validators'
import { validateEnv } from '@/shared/utils/env'

export const rmqEnv = registerAs<RmqConfig>('rmq', () => {
	validateEnv(process.env, RmqValidator)

	return {
		url: process.env.RMQ_URL
	}
})
