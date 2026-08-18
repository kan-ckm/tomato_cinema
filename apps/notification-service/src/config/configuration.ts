import validationSchema from './validation.schema'

/**
 * Factory function nạp và chuẩn hóa cấu hình cho NestJS ConfigModule.
 * Tự động validate biến môi trường khi ứng dụng khởi động.
 */
export default () => {
	// Parse và kiểm tra tính hợp lệ của process.env dựa theo schema Zod
	const parsed = validationSchema.safeParse(process.env)

	// Nếu cấu hình không hợp lệ hoặc thiếu biến môi trường bắt buộc, in lỗi và thoát ứng dụng
	if (!parsed.success) {
		console.error('Invalid environment variables', parsed.error.format())
		process.exit(1)
	}

	const env = parsed.data

	// Trả về cấu trúc cấu hình phân cấp logic để truy xuất qua ConfigService
	return {
		app: {
			nodeEnv: env.NODE_ENV
		},
		rmq: {
			url: env.RMQ_URL,
			queue: env.RMQ_QUEUE
		},
		smtp: {
			host: env.SMTP_HOST,
			username: env.SMTP_USERNAME,
			password: env.SMTP_PASSWORD,
			port: env.SMTP_PORT,
			secure: env.SMTP_SECURE,
			fromAddress: env.SMTP_FROM_ADDRESS
		}
	}
}
