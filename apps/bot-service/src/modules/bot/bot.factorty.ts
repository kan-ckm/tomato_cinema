import { session, Telegraf } from 'telegraf'
import { CONFIG } from '@/config'
import { Session, TelegrafContext } from '@/shared'
import { registerBothandlers } from './handlers'

export function createBot() {
	const bot = new Telegraf<TelegrafContext>(CONFIG.BOT_TOKEN!)

	bot.use(
		session({
			defaultSession: (): Session => ({
				id: undefined
			})
		})
	)
	registerBothandlers(bot)
	return bot
}
