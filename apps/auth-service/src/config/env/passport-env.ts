import { registerAs } from '@nestjs/config'
import { validateEnv } from '@/shared/utils/env'
import { PassportConfig } from '../interfaces'
import { PassportValidator } from '../validators'

export const passportEnv = registerAs<PassportConfig>('passport', () => {
	validateEnv(process.env, PassportValidator)

	return {
		secretKey: process.env.PASSPORT_SECRET_KEY,
		accessTtl: parseInt(process.env.PASSPORT_ACCESS_TTL),
		refreshTtl: parseInt(process.env.PASSPORT_REFRESH_TTL)
	}
})
