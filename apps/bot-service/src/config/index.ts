import * as dotenv from 'dotenv'

dotenv.config()

let botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || ''
const botId = process.env.BOT_ID || process.env.TELEGRAM_BOT_ID

if (botToken && !botToken.includes(':') && botId) {
	botToken = `${botId}:${botToken}`
}

export const CONFIG = {
	BOT_TOKEN: botToken,
	AUTH_GRPC_URL: process.env.AUTH_GRPC_URL
}
