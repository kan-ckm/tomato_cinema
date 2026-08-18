import z from 'zod'

/**
 * Danh sách các môi trường thực thi của ứng dụng
 */
export enum Enviroment {
	Development = 'development',
	Production = 'production',
	Test = 'test'
}

/**
 * Schema xác thực biến môi trường (process.env) sử dụng Zod
 */
export default z.object({
	// Môi trường chạy ứng dụng (mặc định là development)
	NODE_ENV: z.enum(Enviroment).default(Enviroment.Development),

	// URL kết nối RabbitMQ (bắt buộc, không được để trống)
	RMQ_URL: z.string().nonempty(),

	// Tên queue lắng nghe sự kiện của notification service (bắt buộc, không được để trống)
	RMQ_QUEUE: z.string().nonempty(),

	// Cấu hình SMTP
	SMTP_HOST: z.string().nonempty(),
	SMTP_PORT: z.coerce.number(),
	SMTP_USERNAME: z.string().nonempty(),
	SMTP_PASSWORD: z.string().nonempty(),
	SMTP_FROM_ADDRESS: z.email().nonempty(),
	SMTP_SECURE: z.string().transform(v => v === 'true')
})
