import { createBot } from './module/bot/bot.factorty'

async function bootstrap() {
	try {
		const bot = createBot()
		bot.launch()
	} catch (error) {
		console.log('lỗi khi chạy bot', error)
		process.exit(1)
	}
}

bootstrap()
