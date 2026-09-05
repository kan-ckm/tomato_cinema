import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthClientGrpc } from '../auth.grpc'
import { AuthController } from './auth.controller'

describe('Gateway AuthController', () => {
	let controller: AuthController
	let configService: jest.Mocked<ConfigService>
	let client: jest.Mocked<AuthClientGrpc>
	let mockResponse: any

	beforeEach(() => {
		configService = {
			getOrThrow: jest.fn((key: string) => {
				if (key === 'NODE_ENV') return 'development'
				if (key === 'COOKIE_DOMAIN') return 'localhost'
				return ''
			})
		} as any

		client = {
			call: jest.fn()
		} as any

		mockResponse = {
			cookie: jest.fn()
		}

		controller = new AuthController(configService, client)
	})

	describe('register', () => {
		it('nên gọi gRPC register, gắn refreshToken vào cookie và trả về accessToken', async () => {
			client.call.mockResolvedValueOnce({
				accessToken: 'mock-access-token',
				refreshToken: 'mock-refresh-token'
			})

			const dto = {
				email: 'user@tomatocinema.com',
				password: 'password123'
			}

			const result = await controller.register(dto, mockResponse)

			expect(client.call).toHaveBeenCalledWith('register', dto)
			expect(mockResponse.cookie).toHaveBeenCalledWith(
				'refreshToken',
				'mock-refresh-token',
				expect.objectContaining({
					httpOnly: true,
					sameSite: 'lax'
				})
			)
			expect(result).toEqual({ accessToken: 'mock-access-token' })
		})
	})

	describe('login', () => {
		it('nên gọi gRPC login, gắn refreshToken vào cookie và trả về accessToken', async () => {
			client.call.mockResolvedValueOnce({
				accessToken: 'login-access-token',
				refreshToken: 'login-refresh-token'
			})

			const dto = {
				email: 'user@tomatocinema.com',
				password: 'password123'
			}

			const result = await controller.login(dto, mockResponse)

			expect(client.call).toHaveBeenCalledWith('login', dto)
			expect(mockResponse.cookie).toHaveBeenCalledWith(
				'refreshToken',
				'login-refresh-token',
				expect.objectContaining({
					httpOnly: true
				})
			)
			expect(result).toEqual({ accessToken: 'login-access-token' })
		})
	})

	describe('refresh', () => {
		it('nên ném UnauthorizedException nếu không có refreshToken trong cookie', async () => {
			const mockRequest: any = { cookies: {} }

			await expect(
				controller.refresh(mockRequest, mockResponse)
			).rejects.toThrow(UnauthorizedException)
		})

		it('nên làm mới token thành công và cập nhật cookie mới', async () => {
			const mockRequest: any = {
				cookies: { refreshToken: 'old-refresh-token' }
			}

			client.call.mockResolvedValueOnce({
				accessToken: 'new-access-token',
				refreshToken: 'new-refresh-token'
			})

			const result = await controller.refresh(mockRequest, mockResponse)

			expect(client.call).toHaveBeenCalledWith('refresh', {
				refreshToken: 'old-refresh-token'
			})
			expect(mockResponse.cookie).toHaveBeenCalledWith(
				'refreshToken',
				'new-refresh-token',
				expect.any(Object)
			)
			expect(result).toEqual({ accessToken: 'new-access-token' })
		})
	})

	describe('logout', () => {
		it('nên xóa cookie refreshToken và trả về ok', async () => {
			const result = await controller.logout(mockResponse)

			expect(mockResponse.cookie).toHaveBeenCalledWith(
				'refreshToken',
				'',
				expect.objectContaining({
					httpOnly: true,
					expires: new Date(0)
				})
			)
			expect(result).toEqual({ ok: true })
		})
	})

	describe('forgotPassword', () => {
		it('nên gọi gRPC forgotPassword và trả về kết quả', async () => {
			client.call.mockResolvedValueOnce({ ok: true })

			const dto = { email: 'user@tomatocinema.com' }
			const result = await controller.forgotPassword(dto)

			expect(client.call).toHaveBeenCalledWith('forgotPassword', dto)
			expect(result).toEqual({ ok: true })
		})
	})

	describe('resetPassword', () => {
		it('nên gọi gRPC resetPassword và trả về kết quả', async () => {
			client.call.mockResolvedValueOnce({ ok: true })

			const dto = {
				email: 'user@tomatocinema.com',
				code: '123456',
				newPassword: 'new-password-123'
			}
			const result = await controller.resetPassword(dto)

			expect(client.call).toHaveBeenCalledWith('resetPassword', dto)
			expect(result).toEqual({ ok: true })
		})
	})

	describe('changePassword', () => {
		it('nên gọi gRPC changePassword kèm theo userId và trả về kết quả', async () => {
			client.call.mockResolvedValueOnce({ ok: true })

			const userId = 'user-uuid-123'
			const dto = {
				currentPassword: 'old-password-123',
				newPassword: 'new-password-123'
			}
			const result = await controller.changePassword(userId, dto)

			expect(client.call).toHaveBeenCalledWith('changePassword', {
				...dto,
				userId
			})
			expect(result).toEqual({ ok: true })
		})
	})
})
