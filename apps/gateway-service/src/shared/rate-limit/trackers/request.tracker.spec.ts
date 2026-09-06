import { Request } from 'express'
import { RequestTracker } from './request.tracker'

describe('RequestTracker', () => {
	const createMockRequest = (overrides: Partial<Request> = {}): Request =>
		({
			path: '/api/v1/some-path',
			headers: {},
			body: {},
			ip: '127.0.0.1',
			...overrides
		}) as unknown as Request

	describe('OTP flow tracking', () => {
		it('should resolve key as otp:<identifier> when path includes /otp/send and identifier is provided', () => {
			const req = createMockRequest({
				path: '/api/v1/auth/otp/send',
				body: { identifier: 'tomato@example.com' }
			})

			const key = RequestTracker.resolveKey(req)
			expect(key).toBe('otp:tomato@example.com')
		})

		it('should not use otp key if body has no identifier even if path includes /otp/send', () => {
			const req = createMockRequest({
				path: '/api/v1/auth/otp/send',
				body: {},
				ip: '192.168.1.1'
			})

			const key = RequestTracker.resolveKey(req)
			expect(key).toBe('ip:192.168.1.1')
		})
	})

	describe('Authenticated user tracking', () => {
		it('should resolve key as user:<id> when user is authenticated', () => {
			const req = createMockRequest({
				path: '/api/v1/account',
				user: { id: 'usr_123456' }
			} as any)

			const key = RequestTracker.resolveKey(req)
			expect(key).toBe('user:usr_123456')
		})

		it('should prioritize user ID over IP headers for authenticated users', () => {
			const req = createMockRequest({
				path: '/api/v1/account',
				headers: { 'cf-connecting-ip': '203.0.113.195' },
				user: { id: 'usr_789' }
			} as any)

			const key = RequestTracker.resolveKey(req)
			expect(key).toBe('user:usr_789')
		})
	})

	describe('Cloudflare and Proxy IP tracking', () => {
		it('should resolve key using cf-connecting-ip when present', () => {
			const req = createMockRequest({
				headers: {
					'cf-connecting-ip': '198.51.100.42',
					'x-forwarded-for': '198.51.100.42, 10.0.0.1'
				},
				ip: '10.0.0.1'
			})

			const key = RequestTracker.resolveKey(req)
			expect(key).toBe('ip:198.51.100.42')
		})

		it('should resolve key using first IP from x-forwarded-for if cf-connecting-ip is absent', () => {
			const req = createMockRequest({
				headers: {
					'x-forwarded-for': '203.0.113.50, 198.51.100.1, 10.0.0.2'
				},
				ip: '10.0.0.2'
			})

			const key = RequestTracker.resolveKey(req)
			expect(key).toBe('ip:203.0.113.50')
		})

		it('should fallback to req.ip when proxy headers are absent', () => {
			const req = createMockRequest({
				headers: {},
				ip: '172.16.0.5'
			})

			const key = RequestTracker.resolveKey(req)
			expect(key).toBe('ip:172.16.0.5')
		})

		it('should fallback to ip:unknown when req.ip is undefined or empty', () => {
			const req = createMockRequest({
				headers: {},
				ip: undefined
			})

			const key = RequestTracker.resolveKey(req)
			expect(key).toBe('ip:unknown')
		})
	})
})
