import { registerAs } from '@nestjs/config'
import { TelegramConfig } from 'config/interfaces'
import { TelegramValidator } from 'config/validators'
import { validateEnv } from '@/shared/utils/env'

export const telegramEnv = registerAs<TelegramConfig>('telegram', () => {
	validateEnv(process.env, TelegramValidator)

	return {
		botId: process.env.TELEGRAM_BOT_ID,
		botToken: process.env.TELEGRAM_BOT_TOKEN,
		botUsername: process.env.TELEGRAM_BOT_USERNAME,
		redirectOrigin: process.env.TELEGRAM_REDIRECT_ORIGIN
	}
})
