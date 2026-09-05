import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import {
	AuthResponse,
	LoginRequest,
	RefreshRequest,
	RefreshResponse,
	RegisterRequest
} from '@tomatocinema/contracts/gen/auth'
import type { Account } from 'generated/client'
import { MessagingService } from '@/infrastructure/messaging/messaging.service'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { AccountRepository } from '../../account/repositories/account.repository'
import { TokenService } from '../../token/token.service'
import { UsersClientGrpc } from '../../users/users.grpc'
import { PasswordService } from './hash-password.service'

/**
 * Service trung tâm xử lý nghiệp vụ Xác thực (Authentication).
 * Điều phối giữa AccountRepository, PasswordService, TokenService, RedisService và User-Service gRPC.
 */
@Injectable()
export class AuthService {
	public constructor(
		private readonly accountRepository: AccountRepository,
		private readonly passwordService: PasswordService,
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
		private readonly messagingService: MessagingService,
		private readonly usersClient: UsersClientGrpc
	) {}

	//ĐĂNG KÝ BẰNG EMAIL VÀ MẬT KHẨU

	/**
	 * Đăng ký tài khoản mới bằng Email và Mật khẩu.
	 * Băm mật khẩu qua Argon2id, tạo tài khoản trong DB, đồng bộ sang user-service và cấp phát token.
	 */
	public async register(data: RegisterRequest): Promise<AuthResponse> {
		const { email, password } = data

		if (!email || !password) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Email và mật khẩu không được để trống'
			})
		}

		if (password.length < 6) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Mật khẩu phải có ít nhất 6 ký tự'
			})
		}

		const normalizedEmail = email.trim().toLowerCase()

		//Kiểm tra email đã tồn tại trong hệ thống chưa
		const existingAccount =
			await this.accountRepository.findByEmail(normalizedEmail)
		if (existingAccount) {
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'Email này đã được sử dụng'
			})
		}

		const passwordHash = await this.passwordService.hash(password)

		//Tạo tài khoản trong PostgreSQL
		let account: Account
		try {
			account = await this.accountRepository.create({
				email: normalizedEmail,
				passwordHash,
				isEmailVerified: true
			})
		} catch (error: unknown) {
			if ((error as { code?: string })?.code === 'P2002') {
				throw new RpcException({
					code: RpcStatus.ALREADY_EXISTS,
					details: 'Email này đã được sử dụng'
				})
			}
			throw error
		}

		//Đồng bộ tạo Profile sang user-service
		try {
			await this.usersClient.create({ id: account.id })
		} catch {
			// Rollback: Xóa bản ghi account vừa tạo nếu user-service gặp lỗi
			await this.accountRepository.delete(account.id)
			throw new RpcException({
				code: RpcStatus.INTERNAL,
				details: 'Khởi tạo hồ sơ người dùng thất bại. Vui lòng thử lại.'
			})
		}

		//Sinh cặp Access Token và Refresh Token
		return this.tokenService.generate(account.id)
	}

	//ĐĂNG NHẬP BẰNG EMAIL VÀ MẬT KHẨU

	/**
	 * Đăng nhập bằng Email và Mật khẩu.
	 * Đối chiếu thông tin với DB và kiểm tra chữ ký băm mật khẩu qua Argon2id.
	 */
	public async login(data: LoginRequest): Promise<AuthResponse> {
		const { email, password } = data

		if (!email || !password) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Email và mật khẩu không được để trống'
			})
		}

		const normalizedEmail = email.trim().toLowerCase()

		//Tìm tài khoản theo Email
		const account =
			await this.accountRepository.findByEmail(normalizedEmail)
		if (!account || !account.passwordHash) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Email hoặc mật khẩu không chính xác'
			})
		}

		//Kiểm tra mật khẩu khớp với hash Argon2id
		const isPasswordValid = await this.passwordService.compare(
			password,
			account.passwordHash
		)
		if (!isPasswordValid) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Email hoặc mật khẩu không chính xác'
			})
		}

		//Cấp Access Token và Refresh Token
		return this.tokenService.generate(account.id)
	}

	//LÀM MỚI TOKEN (REFRESH TOKEN)

	/**
	 * Cấp lại cặp Token mới khi Access Token hết hạn
	 */
	public async refresh(data: RefreshRequest): Promise<RefreshResponse> {
		const { refreshToken } = data
		const result = this.tokenService.verify(refreshToken)

		if (!result.valid) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: result.reason
			})
		}

		return await Promise.resolve(this.tokenService.generate(result.userId))
	}
}
