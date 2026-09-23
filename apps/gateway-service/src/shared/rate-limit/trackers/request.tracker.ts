import { Request } from 'express'

export class RequestTracker {
	public static resolveKey(req: Request): string {
		// Luồng gửi OTP: Khóa theo chính Email / SĐT nhận mã trong body
		const identifier =
			req.body?.identifier || req.body?.email || req.body?.phone
		if (
			identifier &&
			(req.path.includes('/otp') ||
				req.path.includes('/verification') ||
				req.path.includes('/forgot-password') ||
				req.path.includes('/init') ||
				req.path.includes('verify'))
		) {
			return `otp:${identifier}`
		}

		//Đã đăng nhập: Khóa theo User ID (tránh việc đổi IP/4G để bypass)
		const user = (req as any).user
		if (user?.id) {
			return `user:${user.id}`
		}

		//Khách vãng lai: Đọc IP thật do Cloudflare gắn vào header
		const cfConnectingIp = req.headers['cf-connecting-ip']
		if (typeof cfConnectingIp === 'string') {
			return `ip:${cfConnectingIp}`
		}

		const xForwardedFor = req.headers['x-forwarded-for']
		if (typeof xForwardedFor === 'string') {
			return `ip:${xForwardedFor.split(',')[0].trim()}`
		}

		return `ip:${req.ip || 'unknown'}`
	}
}
