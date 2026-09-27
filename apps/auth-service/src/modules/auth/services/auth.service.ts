import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import {
	AuthResponse,
	LoginRequest,
	LogoutRequest,
	LogoutResponse,
	RefreshRequest,
	RefreshResponse,
	RegisterRequest,
	RegisterResponse,
	ResendVerificationRequest,
	ResendVerificationResponse,
	VerifyEmailRequest
} from '@tomatocinema/contracts/gen/auth'
import type { Account } from 'generated/client'
import { PinoLogger } from 'nestjs-pino'
import { MessagingService } from '@/infrastructure/messaging/messaging.service'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { AccountRepository } from '@/modules/account/repositories'
import { OtpService } from '@/modules/otp/otp.service'
import { HashPasswordService } from '@/shared/hash-password'
import { TokenService } from '../../token/token.service'

/**
 * Service trung tâm xử lý nghiệp vụ Xác thực (Authentication).
 * Điều phối giữa AccountRepository, PasswordService, TokenService, RedisService, OtpService và RabbitMQ.
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
		private readonly otpService: OtpService
	) {
		this.logger.setContext(AuthService.name)
	}

	// ==========================================
	// 1. ĐĂNG KÝ BẰNG EMAIL VÀ MẬT KHẨU (GỬI OTP)
	// ==========================================

	/**
	 * Tiếp nhận thông tin đăng ký, tạo tài khoản tạm thời với isEmailVerified = false,
	 * sinh mã OTP và phát sự kiện gửi email qua RabbitMQ.
	 */
	public async register(data: RegisterRequest): Promise<RegisterResponse> {
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
			'Bắt đầu xử lý đăng ký tài khoản mới'
		)

		// Kiểm tra email đã tồn tại trong hệ thống chưa
		const existingAccount =
			await this.accountRepository.findByEmail(normalizedEmail)

		const passwordHash = await this.hashPasswordService.hash(password)

		if (existingAccount) {
			if (existingAccount.isEmailVerified) {
				this.logger.warn(
					{ email: normalizedEmail },
					'Đăng ký thất bại: Email đã được xác thực trước đó'
				)
				throw new RpcException({
					code: RpcStatus.ALREADY_EXISTS,
					details: 'Email này đã được sử dụng'
				})
			}

			// Nếu tài khoản đã tạo nhưng chưa xác thực email, cho phép cập nhật lại mật khẩu mới
			await this.accountRepository.update(existingAccount.id, {
				passwordHash
			})
			this.logger.info(
				{ accountId: existingAccount.id, email: normalizedEmail },
				'Tài khoản chưa xác thực tồn tại, cập nhật lại mật khẩu mới'
			)
		} else {
			// Tạo tài khoản mới với isEmailVerified = false
			try {
				await this.accountRepository.create({
					email: normalizedEmail,
					passwordHash,
					isEmailVerified: false
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
		}

		// Sinh mã OTP và lưu vào Redis cache với TTL 5 phút
		const { code } = await this.otpService.send(normalizedEmail, 'email')

		// Phát sự kiện RabbitMQ để notification-service gửi email xác thực
		await this.messagingService.otpRequested({
			identifier: normalizedEmail,
			type: 'email',
			code
		})

		this.logger.info(
			{ email: normalizedEmail },
			'Đã sinh mã OTP và phát sự kiện gửi email xác thực'
		)

		return {
			ok: true,
			message:
				'Mã xác thực đã được gửi tới email của bạn. Vui lòng xác thực để kích hoạt tài khoản.',
			email: normalizedEmail
		}
	}

	// ==========================================
	// 2. XÁC THỰC EMAIL BẰNG MÃ OTP & ĐỒNG BỘ PROFILE
	// ==========================================

	/**
	 * Kiểm tra mã OTP. Nếu hợp lệ:
	 * - Kích hoạt tài khoản (isEmailVerified = true)
	 * - Phát sự kiện RabbitMQ auth.account.registered để user-service tạo profile
	 * - Cấp phát bộ JWT token (Access Token & Refresh Token)
	 */
	public async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
		const { email, code } = data

		if (!email || !code) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Email và mã xác thực không được để trống'
			})
		}

		const normalizedEmail = email.trim().toLowerCase()
		this.logger.info(
			{ email: normalizedEmail },
			'Bắt đầu xử lý xác thực email qua OTP'
		)

		const account =
			await this.accountRepository.findByEmail(normalizedEmail)

		if (!account) {
			this.logger.warn(
				{ email: normalizedEmail },
				'Xác thực thất bại: Không tìm thấy tài khoản'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Tài khoản không tồn tại'
			})
		}

		if (account.isEmailVerified) {
			this.logger.warn(
				{ accountId: account.id, email: normalizedEmail },
				'Email này đã được xác thực trước đó'
			)
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'Email này đã được xác thực trước đó'
			})
		}

		// Kiểm tra mã OTP từ Redis (ném ngoại lệ RpcException nếu không khớp/hết hạn)
		await this.otpService.verify(normalizedEmail, code, 'email')

		// Cập nhật trạng thái tài khoản thành đã xác thực
		await this.accountRepository.update(account.id, {
			isEmailVerified: true
		})

		// Phát sự kiện RabbitMQ bất đồng bộ sang user-service
		await this.messagingService.accountRegistered({
			accountId: account.id,
			email: normalizedEmail
		})

		this.logger.info(
			{ accountId: account.id, email: normalizedEmail },
			'Xác thực email thành công, đã phát sự kiện auth.account.registered'
		)

		// Cấp phát token cho người dùng đăng nhập ngay
		return await this.tokenService.generate(account.id)
	}

	// ==========================================
	// 3. GỬI LẠI MÃ XÁC THỰC EMAIL (RESEND OTP)
	// ==========================================

	/**
	 * Gửi lại mã OTP xác thực email nếu mã cũ hết hạn
	 */
	public async resendVerification(
		data: ResendVerificationRequest
	): Promise<ResendVerificationResponse> {
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

		if (!account) {
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Tài khoản không tồn tại'
			})
		}

		if (account.isEmailVerified) {
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'Email này đã được xác thực'
			})
		}

		const { code } = await this.otpService.send(normalizedEmail, 'email')
		await this.messagingService.otpRequested({
			identifier: normalizedEmail,
			type: 'email',
			code
		})

		this.logger.info(
			{ email: normalizedEmail },
			'Đã gửi lại mã OTP xác thực email'
		)

		return {
			ok: true,
			message: 'Mã xác thực mới đã được gửi tới email của bạn.'
		}
	}

	// ==========================================
	// 4. ĐĂNG NHẬP BẰNG EMAIL VÀ MẬT KHẨU
	// ==========================================

	/**
	 * Đăng nhập bằng Email và Mật khẩu.
	 * Bắt buộc tài khoản đã được xác thực Email (isEmailVerified = true).
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

		// Tìm tài khoản theo Email
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

		// Kiểm tra tài khoản đã xác thực Email chưa
		if (!account.isEmailVerified) {
			this.logger.warn(
				{ accountId: account.id, email: normalizedEmail },
				'Đăng nhập thất bại: Email chưa được xác thực'
			)
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details:
					'Email chưa được xác thực. Vui lòng xác thực email trước khi đăng nhập.'
			})
		}

		// Kiểm tra mật khẩu khớp với hash Argon2id
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

		// Cấp Access Token và Refresh Token (lưu phiên vào Redis)
		return await this.tokenService.generate(account.id)
	}

	// ==========================================
	// 5. LÀM MỚI TOKEN (REFRESH TOKEN ROTATION)
	// ==========================================

	/**
	 * Cấp lại cặp Token mới khi Access Token hết hạn.
	 * Thực hiện Refresh Token Rotation: thu hồi token cũ, cấp token mới.
	 */
	public async refresh(data: RefreshRequest): Promise<RefreshResponse> {
		const { refreshToken } = data
		const result = await this.tokenService.verifyRefreshToken(refreshToken)

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

		// REFRESH TOKEN ROTATION: Thu hồi Refresh Token cũ trước khi cấp token mới
		await this.tokenService.revokeRefreshToken(
			result.userId,
			result.fingerprint
		)

		this.logger.info(
			{ userId: result.userId },
			'Làm mới token thành công (Rotation)'
		)
		return await this.tokenService.generate(result.userId)
	}

	// ==========================================
	// 6. ĐĂNG XUẤT (LOGOUT - THU HỒI REFRESH TOKEN)
	// ==========================================

	/**
	 * Đăng xuất: Thu hồi Refresh Token khỏi Redis để vô hiệu hóa phiên đăng nhập.
	 * Khác với logout client-side (chỉ xóa cookie), đây là thu hồi thật sự ở server.
	 */
	public async logout(data: LogoutRequest): Promise<LogoutResponse> {
		const { refreshToken } = data

		if (!refreshToken) {
			return { ok: true }
		}

		const result = await this.tokenService.verifyRefreshToken(refreshToken)

		if (result.valid) {
			await this.tokenService.revokeRefreshToken(
				result.userId,
				result.fingerprint
			)
			this.logger.info(
				{ userId: result.userId },
				'Đăng xuất thành công, đã thu hồi Refresh Token'
			)
		}

		return { ok: true }
	}
}
