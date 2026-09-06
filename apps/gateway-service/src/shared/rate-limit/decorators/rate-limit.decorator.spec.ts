import { Reflector } from '@nestjs/core'
import { THROTTLER_LIMITS, THROTTLER_NAMES } from '../constants'
import { NoThrottle, ThrottleAuth, ThrottleOtp } from './rate-limit.decorator'

describe('RateLimit Decorators', () => {
	const reflector = new Reflector()

	class TestController {
		@ThrottleOtp()
		otpMethod() {}

		@ThrottleAuth()
		authMethod() {}

		@NoThrottle()
		noThrottleMethod() {}
	}

	it('should apply ThrottleOtp metadata with configured limit and ttl overriding default', () => {
		const limit = reflector.get(
			'THROTTLER:LIMIT' + THROTTLER_NAMES.DEFAULT,
			TestController.prototype.otpMethod
		)
		const ttl = reflector.get(
			'THROTTLER:TTL' + THROTTLER_NAMES.DEFAULT,
			TestController.prototype.otpMethod
		)

		expect(limit).toBe(THROTTLER_LIMITS.OTP.limit)
		expect(ttl).toBe(THROTTLER_LIMITS.OTP.ttl)
	})

	it('should apply ThrottleAuth metadata with configured limit and ttl overriding default', () => {
		const limit = reflector.get(
			'THROTTLER:LIMIT' + THROTTLER_NAMES.DEFAULT,
			TestController.prototype.authMethod
		)
		const ttl = reflector.get(
			'THROTTLER:TTL' + THROTTLER_NAMES.DEFAULT,
			TestController.prototype.authMethod
		)

		expect(limit).toBe(THROTTLER_LIMITS.AUTH.limit)
		expect(ttl).toBe(THROTTLER_LIMITS.AUTH.ttl)
	})

	it('should apply NoThrottle (SkipThrottle) metadata', () => {
		const skip = reflector.get(
			'THROTTLER:SKIP' + THROTTLER_NAMES.DEFAULT,
			TestController.prototype.noThrottleMethod
		)

		expect(skip).toBe(true)
	})
})
