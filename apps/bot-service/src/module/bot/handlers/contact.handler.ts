import {
	TelegramCompleteRequest,
	TelegramCompleteResponse
} from '@tomatocinema/contracts/gen/auth'
import { Telegraf } from 'telegraf'
import { authClient } from '@/infrastructure/grpc/auth.client'
import { TelegrafContext } from '@/shared'
import { callUnary } from '@/shared/utils/call-unary'

export function registerContactHandler(bot: Telegraf<TelegrafContext>) {
	bot.on('contact', async ctx => {
		const phone = ctx.message.contact.phone_number

		// Nếu thiếu ID chat hoặc phiên đăng nhập thì báo lỗi rồi return (kết thúc hàm)
		if (!ctx.chat?.id || !ctx.session?.id) {
			return ctx.reply(
				'Đã xảy ra lỗi. Vui lòng bắt đầu lại quy trình thông qua trang web'
			)
		}

		try {
			const request: TelegramCompleteRequest = {
				sessionId: ctx.session.id,
				phone
			}

			// Gọi sang gRPC Auth Service để hoàn tất liên kết
			const { sessionId } = await callUnary<TelegramCompleteResponse>(
				authClient.telegramComplete.bind(authClient),
				request
			)

			// Gửi tin nhắn thành công kèm nút bấm (Đã bọc trong Object {})
			await ctx.reply('Đăng ký đã hoàn tất thành công!', {
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Quay lại trang web',
								url: `https://tomatocinema.vn/auth/tg-finalize?sessionId=${sessionId}`
							}
						]
					],
					remove_keyboard: true
				}
			})
			console.log('data: ', sessionId)
		} catch (error) {
			console.error('Lỗi xác thực Telegram gRPC:', error)
			await ctx.reply(
				'Hệ thống đang quá tải hoặc bảo trì. Vui lòng thử lại sau ít phút.'
			)
		}
	})
}
