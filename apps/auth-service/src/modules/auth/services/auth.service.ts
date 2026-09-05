import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import {
	AuthResponse,
	ChangePasswordRequest,
	ChangePasswordResponse,
	ForgotPasswordRequest,
	ForgotPasswordResponse,
	LoginRequest,
	RefreshRequest,
	RefreshResponse,
	RegisterRequest,
	ResetPasswordRequest,
	ResetPasswordResponse
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

		// 1. Tìm tài khoản theo Email
		const account =
			await this.accountRepository.findByEmail(normalizedEmail)
		if (!account || !account.passwordHash) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Email hoặc mật khẩu không chính xác'
			})
		}

		// 2. Kiểm tra mật khẩu khớp với hash Argon2id
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

		// 3. Cấp Access Token và Refresh Token
		return this.tokenService.generate(account.id)
	}

	// ==========================================
	// 3. LÀM MỚI TOKEN (REFRESH TOKEN)
	// ==========================================

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

	// ==========================================
	// 4. QUÊN MẬT KHẨU (GỬI MÃ QUA EMAIL)
	// ==========================================

	/**
	 * Tiếp nhận yêu cầu quên mật khẩu, sinh mã xác thực và gửi qua RabbitMQ đến notification-service
	 */
	public async forgotPassword(
		data: ForgotPasswordRequest
	): Promise<ForgotPasswordResponse> {
		const { email } = data

		if (!email) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Email không được để trống'
			})
		}

		const normalizedEmail = email.trim().toLowerCase()
		const account =
			await this.accountRepository.findByEmail(normalizedEmail)

		// Để bảo mật chống dò email (User Enumeration Attack):
		// Nếu tài khoản không tồn tại, vẫn trả về ok = true giả lập như đã gửi mail
		if (account) {
			// Sinh mã xác thực 6 chữ số ngẫu nhiên
			const code = Math.floor(100000 + Math.random() * 900000).toString()

			// Lưu mã vào Redis trong 15 phút (900 giây)
			await this.redisService.set(
				`password_reset:${normalizedEmail}`,
				code,
				'EX',
				15 * 60
			)

			// Gửi sự kiện qua RabbitMQ để Worker gửi email
			await this.messagingService.passwordResetRequested({
				email: normalizedEmail,
				code,
				expiresInMinutes: 15
			})
		}

		return { ok: true }
	}

	// ==========================================
	// 5. ĐẶT LẠI MẬT KHẨU (BẰNG MÃ XÁC THỰC EMAIL)
	// ==========================================

	/**
	 * Xác nhận mã đặt lại mật khẩu và cập nhật mật khẩu mới bằng Argon2id
	 */
	public async resetPassword(
		data: ResetPasswordRequest
	): Promise<ResetPasswordResponse> {
		const { email, code, newPassword } = data

		if (!email || !code || !newPassword) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details:
					'Vui lòng cung cấp đầy đủ email, mã xác thực và mật khẩu mới'
			})
		}

		if (newPassword.length < 6) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Mật khẩu mới phải có ít nhất 6 ký tự'
			})
		}

		const normalizedEmail = email.trim().toLowerCase()

		// 1. Kiểm tra mã xác thực từ Redis
		const storedCode = await this.redisService.get(
			`password_reset:${normalizedEmail}`
		)

		if (!storedCode || storedCode !== code.trim()) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Mã xác thực không chính xác hoặc đã hết hạn'
			})
		}

		// 2. Tìm tài khoản
		const account =
			await this.accountRepository.findByEmail(normalizedEmail)
		if (!account) {
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Tài khoản không tồn tại'
			})
		}

		// 3. Băm mật khẩu mới bằng Argon2id
		const passwordHash = await this.passwordService.hash(newPassword)

		// 4. Cập nhật mật khẩu trong DB
		await this.accountRepository.update(account.id, {
			passwordHash
		})

		// 5. Xóa mã xác thực khỏi Redis (chỉ sử dụng 1 lần)
		await this.redisService.del(`password_reset:${normalizedEmail}`)

		// 6. Gửi thông báo email xác nhận mật khẩu đã thay đổi
		await this.messagingService.passwordChanged({
			email: normalizedEmail
		})

		return { ok: true }
	}

	// ==========================================
	// 6. ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP
	// ==========================================

	/**
	 * Đổi mật khẩu chủ động cho người dùng đã đăng nhập
	 */
	public async changePassword(
		data: ChangePasswordRequest
	): Promise<ChangePasswordResponse> {
		const { userId, currentPassword, newPassword } = data

		if (!userId || !currentPassword || !newPassword) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Vui lòng cung cấp đầy đủ thông tin'
			})
		}

		if (newPassword.length < 6) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Mật khẩu mới phải có ít nhất 6 ký tự'
			})
		}

		const account = await this.accountRepository.findById(userId)
		if (!account || !account.passwordHash) {
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Tài khoản không tồn tại'
			})
		}

		// 1. Kiểm tra mật khẩu hiện tại
		const isCurrentValid = await this.passwordService.compare(
			currentPassword,
			account.passwordHash
		)

		if (!isCurrentValid) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Mật khẩu hiện tại không chính xác'
			})
		}

		// 2. Băm mật khẩu mới bằng Argon2id
		const passwordHash = await this.passwordService.hash(newPassword)

		// 3. Cập nhật DB
		await this.accountRepository.update(account.id, {
			passwordHash
		})

		// 4. Gửi email thông báo nếu tài khoản có email
		if (account.email) {
			await this.messagingService.passwordChanged({
				email: account.email
			})
		}

		return { ok: true }
	}
}
