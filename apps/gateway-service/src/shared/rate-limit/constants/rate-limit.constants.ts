export const THROTTLER_NAMES = {
	DEFAULT: 'default',
	AUTH: 'auth',
	OTP: 'otp'
} as const

export const THROTTLER_LIMITS = {
	DEFAULT: { ttl: 60_000, limit: 100 }, // 100 req / phút
	AUTH: { ttl: 60_000, limit: 5 }, // 5 req / phút (chống brute force)
	OTP: { ttl: 60_000, limit: 3 } // 3 req / phút (chống spam OTP)
} as const
