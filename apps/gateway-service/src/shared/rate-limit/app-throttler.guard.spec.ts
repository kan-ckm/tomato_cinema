import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { AppThrottlerGuard } from './app-throttler.guard'
import { RequestTracker } from './trackers/request.tracker'

describe('AppThrottlerGuard', () => {
	let guard: AppThrottlerGuard

	beforeEach(() => {
		const options = { throttlers: [] }
		const storageService = {} as any
		const reflector = new Reflector()
		guard = new AppThrottlerGuard(options, storageService, reflector)
	})

	it('should be defined', () => {
		expect(guard).toBeDefined()
	})

	it('should delegate getTracker to RequestTracker.resolveKey', async () => {
		const mockRequest = {
			path: '/api/v1/auth/login',
			headers: { 'cf-connecting-ip': '1.2.3.4' },
			body: {}
		} as unknown as Request

		const spy = jest.spyOn(RequestTracker, 'resolveKey')

		// Call protected getTracker
		const result = await (guard as any).getTracker(mockRequest)

		expect(spy).toHaveBeenCalledWith(mockRequest)
		expect(result).toBe('ip:1.2.3.4')

		spy.mockRestore()
	})
})
