import { Controller, Get, INestApplication } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { seconds, ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { AppThrottlerGuard } from './app-throttler.guard'
import { NoThrottle, ThrottleAuth, ThrottleOtp } from './decorators'

@Controller('test-rate-limit')
class MockTestController {
	@Get('default')
	getDefault() {
		return { message: 'default allowed' }
	}

	@ThrottleAuth()
	@Get('auth-sensitive')
	getAuth() {
		return { message: 'auth allowed' }
	}

	@ThrottleOtp()
	@Get('otp-sensitive')
	getOtp() {
		return { message: 'otp allowed' }
	}

	@NoThrottle()
	@Get('unlimited')
	getUnlimited() {
		return { message: 'unlimited allowed' }
	}
}

describe('RateLimit Integration (e2e-like)', () => {
	let app: INestApplication

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [
				ThrottlerModule.forRoot([
					{
						name: 'default',
						ttl: seconds(60),
						limit: 3
					}
				])
			],
			controllers: [MockTestController],
			providers: [
				{
					provide: APP_GUARD,
					useClass: AppThrottlerGuard
				}
			]
		}).compile()

		app = moduleRef.createNestApplication()
		await app.init()
	})

	afterAll(async () => {
		await app.close()
	})

	it('should allow requests within limit and reject with 429 when exceeded', async () => {
		const clientIp = '192.0.2.1'

		// 3 requests allowed under default limit
		await request(app.getHttpServer())
			.get('/test-rate-limit/default')
			.set('cf-connecting-ip', clientIp)
			.expect(200)

		await request(app.getHttpServer())
			.get('/test-rate-limit/default')
			.set('cf-connecting-ip', clientIp)
			.expect(200)

		await request(app.getHttpServer())
			.get('/test-rate-limit/default')
			.set('cf-connecting-ip', clientIp)
			.expect(200)

		// 4th request must be rejected with 429 Too Many Requests
		const response = await request(app.getHttpServer())
			.get('/test-rate-limit/default')
			.set('cf-connecting-ip', clientIp)
			.expect(429)

		expect(response.body.statusCode).toBe(429)
		expect(response.body.message).toMatch(/throttler/i)
	})

	it('should not throttle a different client IP', async () => {
		const differentIp = '192.0.2.2'

		await request(app.getHttpServer())
			.get('/test-rate-limit/default')
			.set('cf-connecting-ip', differentIp)
			.expect(200)
	})

	it('should respect @ThrottleOtp custom limit (1 req / 60s)', async () => {
		const clientIp = '198.51.100.30'

		// 1st request succeeds
		await request(app.getHttpServer())
			.get('/test-rate-limit/otp-sensitive')
			.set('cf-connecting-ip', clientIp)
			.expect(200)

		// 2nd request is blocked immediately with 429
		await request(app.getHttpServer())
			.get('/test-rate-limit/otp-sensitive')
			.set('cf-connecting-ip', clientIp)
			.expect(429)
	})

	it('should never block routes decorated with @NoThrottle()', async () => {
		const clientIp = '198.51.100.20'

		for (let i = 0; i < 6; i++) {
			await request(app.getHttpServer())
				.get('/test-rate-limit/unlimited')
				.set('cf-connecting-ip', clientIp)
				.expect(200)
		}
	})
})
