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
import { PinoLogger } from 'nestjs-pino'
import { MessagingService } from '@/infrastructure/messaging/messaging.service'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { AccountRepository } from '@/modules/account/repositories'
import { HashPasswordService } from '@/shared/hash-password'
import { TokenService } from '../../token/token.service'
import { UsersClientGrpc } from '../../users/users.grpc'

/**
 * Service trung tâm xử lý nghiệp vụ Xác thực (Authentication).
 * Điều phối giữa AccountRepository, PasswordService, TokenService, RedisService và User-Service gRPC.
 */
@Injectable()
export class AuthService {
	public constructor(
		private readonly logger: PinoLogger,
		private readonly accountRepository: AccountRepository,
		private readonly hashPasswordService: HashPasswordService,
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
		private readonly messagingService: MessagingService,
		private readonly usersClient: UsersClientGrpc
	) {
		this.logger.setContext(AuthService.name)
	}

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
		this.logger.info(
			{ email: normalizedEmail },
			'Bắt đầu xử lý đăng ký tài khoản'
		)

		//Kiểm tra email đã tồn tại trong hệ thống chưa
		const existingAccount =
			await this.accountRepository.findByEmail(normalizedEmail)
		if (existingAccount) {
			this.logger.warn(
				{ email: normalizedEmail },
				'Đăng ký thất bại: Email đã tồn tại'
			)
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'Email này đã được sử dụng'
			})
		}

		const passwordHash = await this.hashPasswordService.hash(password)

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
				this.logger.warn(
					{ email: normalizedEmail },
					'Đăng ký thất bại: Xung đột tài khoản (P2002)'
				)
				throw new RpcException({
					code: RpcStatus.ALREADY_EXISTS,
					details: 'Email này đã được sử dụng'
				})
			}
			this.logger.error(
				{ error, email: normalizedEmail },
				'Lỗi khi lưu tài khoản vào database'
			)
			throw error
		}

		//Đồng bộ tạo Profile sang user-service
		try {
			await this.usersClient.create({ id: account.id })
		} catch (error: unknown) {
			this.logger.error(
				{ error, accountId: account.id, email: normalizedEmail },
				'Khởi tạo profile user-service thất bại, thực hiện rollback xóa account'
			)
			// Rollback: Xóa bản ghi account vừa tạo nếu user-service gặp lỗi
			await this.accountRepository.delete(account.id)
			throw new RpcException({
				code: RpcStatus.INTERNAL,
				details: 'Khởi tạo hồ sơ người dùng thất bại. Vui lòng thử lại.'
			})
		}

		this.logger.info(
			{ accountId: account.id, email: normalizedEmail },
			'Đăng ký tài khoản và khởi tạo profile thành công'
		)

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
		this.logger.info(
			{ email: normalizedEmail },
			'Yêu cầu đăng nhập tài khoản'
		)

		//Tìm tài khoản theo Email
		const account =
			await this.accountRepository.findByEmail(normalizedEmail)
		if (!account || !account.passwordHash) {
			this.logger.warn(
				{ email: normalizedEmail },
				'Đăng nhập thất bại: Tài khoản không tồn tại'
			)
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Email hoặc mật khẩu không chính xác'
			})
		}

		//Kiểm tra mật khẩu khớp với hash Argon2id
		const isPasswordValid = await this.hashPasswordService.compare(
			password,
			account.passwordHash
		)
		if (!isPasswordValid) {
			this.logger.warn(
				{ accountId: account.id, email: normalizedEmail },
				'Đăng nhập thất bại: Mật khẩu không chính xác'
			)
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Email hoặc mật khẩu không chính xác'
			})
		}

		this.logger.info(
			{ accountId: account.id, email: normalizedEmail },
			'Đăng nhập thành công, cấp phát token'
		)

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
			this.logger.warn(
				{ reason: result.reason },
				'Làm mới token thất bại'
			)
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: result.reason
			})
		}

		this.logger.info({ userId: result.userId }, 'Làm mới token thành công')
		return await Promise.resolve(this.tokenService.generate(result.userId))
	}
}
