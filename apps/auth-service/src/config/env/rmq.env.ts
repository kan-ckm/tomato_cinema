import { registerAs } from '@nestjs/config'
import { validateEnv } from '@/shared/utils/env'
import { RmqConfig } from '../interfaces/rmq.interface'
import { RmqValidator } from '../validators'

export const rmqEnv = registerAs<RmqConfig>('rmq', () => {
	validateEnv(process.env, RmqValidator)

	return {
		url: process.env.RMQ_URL
	}
})
