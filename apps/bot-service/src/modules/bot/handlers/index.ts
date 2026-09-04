import { Telegraf } from 'telegraf'
import { TelegrafContext } from '@/shared'
import { registerContactHandler } from './contact.handler'
import { registerStartHandler } from './start.handler'

export function registerBothandlers(bot: Telegraf<TelegrafContext>) {
	registerStartHandler(bot)
	registerContactHandler(bot)
}
