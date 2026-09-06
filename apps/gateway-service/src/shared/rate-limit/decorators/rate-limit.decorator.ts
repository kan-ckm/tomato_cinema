import { SkipThrottle, Throttle } from '@nestjs/throttler'
import {
	THROTTLER_LIMITS,
	THROTTLER_NAMES
} from '../constants/rate-limit.constants'

// Decorator chống spam OTP (1 req / phút)
export const ThrottleOtp = () =>
	Throttle({ [THROTTLER_NAMES.DEFAULT]: THROTTLER_LIMITS.OTP })

// Decorator chống brute force đăng nhập (5 req / phút)
export const ThrottleAuth = () =>
	Throttle({ [THROTTLER_NAMES.DEFAULT]: THROTTLER_LIMITS.AUTH })

// Decorator bỏ qua rate limit (cho health check, metrics)
export const NoThrottle = () => SkipThrottle()
