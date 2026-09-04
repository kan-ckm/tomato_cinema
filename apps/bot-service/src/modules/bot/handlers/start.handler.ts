import { Markup, Telegraf } from 'telegraf'
import { TelegrafContext } from '@/shared'

// Hàm đăng ký xử lý khi người dùng bắt đầu chat với Bot (lệnh /start)
export function registerStartHandler(bot: Telegraf<TelegrafContext>) {
	bot.start(async ctx => {
		// Lấy dữ liệu đính kèm từ link khởi động (VD: t.me/bot?start=12345 -> payload là '12345')
		// Đây chính là mã phiên (Session ID) được sinh ra từ API TelegramInit để liên kết tài khoản
		const sessionId = ctx.startPayload

		// Trường hợp 1: Người dùng tự tìm bot trên Telegram và bấm Start (Không có Session ID)
		if (!sessionId) {
			// Yêu cầu quay lại web đăng nhập và đính kèm nút bấm (Inline Keyboard) dưới tin nhắn
			return ctx.reply(
				'Xin chào! Để tiếp tục, vui lòng đăng nhập vào trang web.',
				Markup.inlineKeyboard([
					[
						Markup.button.url(
							'Tiến hành xác thực',
							'https://tomatocinema.vn/auth/login'
						)
					]
				])
			)
		}

		// Trường hợp 2: Có Session ID (chuyển từ web sang), lưu mã này vào bộ nhớ tạm (session) của bot
		ctx.session.id = sessionId

		// Yêu cầu người dùng cung cấp số điện thoại để hệ thống xác thực
		await ctx.reply(
			'Để hoàn tất đăng ký, vui lòng cung cấp số điện thoại của bạn.',
			// Thay thế bàn phím mặc định bằng một nút bấm yêu cầu cấp quyền đọc số điện thoại
			Markup.keyboard([
				[Markup.button.contactRequest('Chia sẻ số điện thoại')]
			])
		)
	})
}
