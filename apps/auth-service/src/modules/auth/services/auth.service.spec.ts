import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import { AccountRepository } from '../../account/repositories/account.repository'
import { TokenService } from '../../token/token.service'
import { UsersClientGrpc } from '../../users/users.grpc'
import { AuthService } from './auth.service'
import { PasswordService } from './hash-password.service'

describe('AuthService', () => {
	let authService: AuthService
	let accountRepository: jest.Mocked<AccountRepository>
	let passwordService: jest.Mocked<PasswordService>
	let tokenService: jest.Mocked<TokenService>
	let usersClient: jest.Mocked<UsersClientGrpc>
	let redisService: any
	let messagingService: any

	beforeEach(() => {
		accountRepository = {
			findByEmail: jest.fn(),
			findByPhone: jest.fn(),
			findById: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		} as any

		passwordService = {
			hash: jest.fn(),
			compare: jest.fn()
		} as any

		tokenService = {
			generate: jest.fn(),
			verify: jest.fn()
		} as any

		usersClient = {
			create: jest.fn()
		} as any

		redisService = {
			get: jest.fn(),
			set: jest.fn(),
			del: jest.fn()
		}

		messagingService = {
			passwordResetRequested: jest.fn(),
			passwordChanged: jest.fn(),
			emailChanged: jest.fn(),
			phoneChanged: jest.fn()
		}

		authService = new AuthService(
			accountRepository,
			passwordService,
			tokenService,
			redisService,
			messagingService,
			usersClient
		)
	})

	describe('register', () => {
		it('nên ném lỗi INVALID_ARGUMENT nếu email hoặc mật khẩu trống', async () => {
			await expect(
				authService.register({ email: '', password: '' })
			).rejects.toThrow(RpcException)
		})

		it('nên ném lỗi INVALID_ARGUMENT nếu mật khẩu dưới 6 ký tự', async () => {
			await expect(
				authService.register({
					email: 'test@gmail.com',
					password: '123'
				})
			).rejects.toThrow(RpcException)
		})

		it('nên ném lỗi ALREADY_EXISTS nếu email đã tồn tại', async () => {
			accountRepository.findByEmail.mockResolvedValueOnce({
				id: 'existing-id'
			} as any)

			try {
				await authService.register({
					email: 'TEST@gmail.com',
					password: 'password123'
				})
				fail('Lẽ ra phải ném RpcException')
			} catch (err: any) {
				expect(err).toBeInstanceOf(RpcException)
				expect(err.getError().code).toBe(RpcStatus.ALREADY_EXISTS)
			}
		})

		it('nên đăng ký tài khoản mới thành công và trả về cặp token', async () => {
			accountRepository.findByEmail.mockResolvedValueOnce(null)
			passwordService.hash.mockResolvedValueOnce('$argon2id$hashed_pass')
			accountRepository.create.mockResolvedValueOnce({
				id: 'account-123',
				email: 'test@gmail.com'
			} as any)
			usersClient.create.mockResolvedValueOnce({ ok: true } as any)
			tokenService.generate.mockReturnValueOnce({
				accessToken: 'access-token-xyz',
				refreshToken: 'refresh-token-xyz'
			})

			const result = await authService.register({
				email: '  Test@Gmail.com  ',
				password: 'password123'
			})

			expect(accountRepository.findByEmail).toHaveBeenCalledWith(
				'test@gmail.com'
			)
			expect(passwordService.hash).toHaveBeenCalledWith('password123')
			expect(accountRepository.create).toHaveBeenCalledWith({
				email: 'test@gmail.com',
				passwordHash: '$argon2id$hashed_pass',
				isEmailVerified: true
			})
			expect(usersClient.create).toHaveBeenCalledWith({
				id: 'account-123'
			})
			expect(result).toEqual({
				accessToken: 'access-token-xyz',
				refreshToken: 'refresh-token-xyz'
			})
		})

		it('nên rollback xóa tài khoản nếu user-service gRPC thất bại', async () => {
			accountRepository.findByEmail.mockResolvedValueOnce(null)
			passwordService.hash.mockResolvedValueOnce('$argon2id$hashed')
			accountRepository.create.mockResolvedValueOnce({
				id: 'account-123'
			} as any)
			usersClient.create.mockRejectedValueOnce(new Error('gRPC error'))
			accountRepository.delete.mockResolvedValueOnce({} as any)

			await expect(
				authService.register({
					email: 'test@gmail.com',
					password: 'password123'
				})
			).rejects.toThrow(RpcException)

			expect(accountRepository.delete).toHaveBeenCalledWith('account-123')
		})
	})

	describe('login', () => {
		it('nên ném lỗi UNAUTHENTICATED nếu email không tồn tại trong DB', async () => {
			accountRepository.findByEmail.mockResolvedValueOnce(null)

			try {
				await authService.login({
					email: 'unknown@gmail.com',
					password: 'password123'
				})
				fail('Lẽ ra phải ném RpcException')
			} catch (err: any) {
				expect(err).toBeInstanceOf(RpcException)
				expect(err.getError().code).toBe(RpcStatus.UNAUTHENTICATED)
			}
		})

		it('nên ném lỗi UNAUTHENTICATED nếu tài khoản chưa đặt mật khẩu (SSO user)', async () => {
			accountRepository.findByEmail.mockResolvedValueOnce({
				id: 'acc-1',
				passwordHash: null
			} as any)

			await expect(
				authService.login({
					email: 'sso@gmail.com',
					password: 'password123'
				})
			).rejects.toThrow(RpcException)
		})

		it('nên ném lỗi UNAUTHENTICATED nếu mật khẩu không khớp', async () => {
			accountRepository.findByEmail.mockResolvedValueOnce({
				id: 'acc-1',
				passwordHash: '$argon2id$hashed'
			} as any)
			passwordService.compare.mockResolvedValueOnce(false)

			await expect(
				authService.login({
					email: 'test@gmail.com',
					password: 'WrongPassword'
				})
			).rejects.toThrow(RpcException)
		})

		it('nên đăng nhập thành công và trả về cặp token khi đúng mật khẩu', async () => {
			accountRepository.findByEmail.mockResolvedValueOnce({
				id: 'acc-1',
				passwordHash: '$argon2id$hashed'
			} as any)
			passwordService.compare.mockResolvedValueOnce(true)
			tokenService.generate.mockReturnValueOnce({
				accessToken: 'access-123',
				refreshToken: 'refresh-123'
			})

			const result = await authService.login({
				email: 'Test@Gmail.com',
				password: 'CorrectPassword'
			})

			expect(result).toEqual({
				accessToken: 'access-123',
				refreshToken: 'refresh-123'
			})
		})
	})

	describe('forgotPassword', () => {
		it('nên sinh mã xác thực trong Redis và phát sự kiện RabbitMQ khi email hợp lệ', async () => {
			accountRepository.findByEmail.mockResolvedValueOnce({
				id: 'acc-1',
				email: 'user@gmail.com'
			} as any)

			const result = await authService.forgotPassword({
				email: '  User@Gmail.com '
			})

			expect(result).toEqual({ ok: true })
			expect(redisService.set).toHaveBeenCalledWith(
				'password_reset:user@gmail.com',
				expect.any(String),
				'EX',
				900
			)
			expect(
				messagingService.passwordResetRequested
			).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'user@gmail.com',
					expiresInMinutes: 15
				})
			)
		})
	})

	describe('resetPassword', () => {
		it('nên ném lỗi nếu mã xác thực từ Redis không khớp', async () => {
			redisService.get.mockResolvedValueOnce('123456')

			await expect(
				authService.resetPassword({
					email: 'user@gmail.com',
					code: '654321',
					newPassword: 'newPassword123'
				})
			).rejects.toThrow(RpcException)
		})

		it('nên cập nhật mật khẩu mới và xóa mã xác thực khỏi Redis khi đúng mã', async () => {
			redisService.get.mockResolvedValueOnce('123456')
			accountRepository.findByEmail.mockResolvedValueOnce({
				id: 'acc-1',
				email: 'user@gmail.com'
			} as any)
			passwordService.hash.mockResolvedValueOnce('$argon2id$new_hash')

			const result = await authService.resetPassword({
				email: 'user@gmail.com',
				code: '123456',
				newPassword: 'newPassword123'
			})

			expect(result).toEqual({ ok: true })
			expect(accountRepository.update).toHaveBeenCalledWith('acc-1', {
				passwordHash: '$argon2id$new_hash'
			})
			expect(redisService.del).toHaveBeenCalledWith(
				'password_reset:user@gmail.com'
			)
			expect(messagingService.passwordChanged).toHaveBeenCalledWith({
				email: 'user@gmail.com'
			})
		})
	})

	describe('changePassword', () => {
		it('nên ném lỗi nếu mật khẩu hiện tại không chính xác', async () => {
			accountRepository.findById.mockResolvedValueOnce({
				id: 'acc-1',
				passwordHash: '$argon2id$current_hash'
			} as any)
			passwordService.compare.mockResolvedValueOnce(false)

			await expect(
				authService.changePassword({
					userId: 'acc-1',
					currentPassword: 'wrong-pass',
					newPassword: 'new-pass-123'
				})
			).rejects.toThrow(RpcException)
		})

		it('nên đổi mật khẩu thành công khi nhập đúng mật khẩu hiện tại', async () => {
			accountRepository.findById.mockResolvedValueOnce({
				id: 'acc-1',
				email: 'user@gmail.com',
				passwordHash: '$argon2id$current_hash'
			} as any)
			passwordService.compare.mockResolvedValueOnce(true)
			passwordService.hash.mockResolvedValueOnce('$argon2id$new_hash')

			const result = await authService.changePassword({
				userId: 'acc-1',
				currentPassword: 'correct-pass',
				newPassword: 'new-pass-123'
			})

			expect(result).toEqual({ ok: true })
			expect(accountRepository.update).toHaveBeenCalledWith('acc-1', {
				passwordHash: '$argon2id$new_hash'
			})
			expect(messagingService.passwordChanged).toHaveBeenCalledWith({
				email: 'user@gmail.com'
			})
		})
	})
})
