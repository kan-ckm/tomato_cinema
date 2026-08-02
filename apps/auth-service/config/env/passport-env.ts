import { registerAs } from '@nestjs/config'
import { PassportConfig } from 'config/interfaces'
import { PassportValidator } from 'config/validators'
import { validateEnv } from '@/shared/utils/env'

export const passportEnv = registerAs<PassportConfig>('passport', () => {
	validateEnv(process.env, PassportValidator)

	return {
		secretKey: process.env.PASSPORT_SECRET_KEY,
		accessTtl: parseInt(process.env.PASSPORT_ACCESS_TTL),
		refreshTtl: parseInt(process.env.PASSPORT_REFRESH_TTL)
	}
})
