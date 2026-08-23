import { registerAs } from '@nestjs/config'
import { validateEnv } from '@/shared/utils/env'
import { PassportConfig } from '../interfaces'
import { PassportValidator } from '../validators'

export const passportEnv = registerAs<PassportConfig>('passport', () => {
	const validatedConfig = validateEnv(process.env, PassportValidator)

	return {
		secretKey: validatedConfig.PASSPORT_SECRET_KEY,
		accessTtl: validatedConfig.PASSPORT_ACCESS_TTL,
		refreshTtl: validatedConfig.PASSPORT_REFRESH_TTL
	}
})
