import { registerAs } from '@nestjs/config'
import { validateEnv } from '@/shared/utils/env'
import { TelegramConfig } from '../interfaces'
import { TelegramValidator } from '../validators'

export const telegramEnv = registerAs<TelegramConfig>('telegram', () => {
	const validatedConfig = validateEnv(process.env, TelegramValidator)

	return {
		botId: validatedConfig.TELEGRAM_BOT_ID,
		botToken: validatedConfig.TELEGRAM_BOT_TOKEN,
		botUsername: validatedConfig.TELEGRAM_BOT_USERNAME,
		redirectOrigin: validatedConfig.TELEGRAM_REDIRECT_ORIGIN
	}
})
