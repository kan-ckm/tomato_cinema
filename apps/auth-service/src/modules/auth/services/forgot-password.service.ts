import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import {
	ForgotPasswordRequest,
	ForgotPasswordResponse,
	ResetPasswordRequest,
	ResetPasswordResponse
} from '@tomatocinema/contracts/gen/ts/auth'
import { randomInt } from 'crypto'
import { PinoLogger } from 'nestjs-pino'
import { MessagingService } from '@/infrastructure/messaging/messaging.service'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { AccountRepository } from '@/modules/account/repositories'
import { TokenService } from '@/modules/token/token.service'
import { HashPasswordService } from '@/shared/hash-password'

@Injectable()
export class ForgotPasswordService {
	//QUÊN MẬT KHẨU (GỬI MÃ QUA EMAIL)
	public constructor(
		private readonly logger: PinoLogger,
		private readonly accountRepository: AccountRepository,
		private readonly hashPasswordService: HashPasswordService,
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
		private readonly messagingService: MessagingService
	) {
		this.logger.setContext(ForgotPasswordService.name)
	}
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
		this.logger.info(
			{ email: normalizedEmail },
			'Tiếp nhận yêu cầu quên mật khẩu'
		)
		const account =
			await this.accountRepository.findByEmail(normalizedEmail)

		// Để bảo mật chống dò email (User Enumeration Attack):
		// Nếu tài khoản không tồn tại, vẫn trả về ok = true giả lập như đã gửi mail
		if (account) {
			// Sinh mã xác thực 6 chữ số ngẫu nhiên an toàn
			const code = randomInt(100000, 1000000).toString()

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
			this.logger.info(
				{ email: normalizedEmail },
				'Đã sinh mã reset và phát sự kiện gửi email'
			)
		} else {
			this.logger.warn(
				{ email: normalizedEmail },
				'Yêu cầu quên mật khẩu cho email không tồn tại (giả lập thành công)'
			)
		}

		return { ok: true }
	}

	//ĐẶT LẠI MẬT KHẨU (BẰNG MÃ XÁC THỰC EMAIL)

	/**
	 * Xác nhận mã đặt lại mật khẩu và cập nhật mật khẩu mới bằng Argon2id
	 */
	public async resetPassword(
		data: ResetPasswordRequest
	): Promise<ResetPasswordResponse> {
		const { email, code, newPassword } = data
		this.logger.info('Tiếp nhận yêu cầu xác thực đặt lại mật khẩu')
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
		this.logger.info(
			{ email: normalizedEmail },
			'Xử lý yêu cầu đặt lại mật khẩu'
		)

		//Kiểm tra mã xác thực từ Redis
		const storedCode = await this.redisService.get(
			`password_reset:${normalizedEmail}`
		)

		if (!storedCode || storedCode !== code.trim()) {
			this.logger.warn(
				{ email: normalizedEmail },
				'Đặt lại mật khẩu thất bại: Mã xác thực không chính xác hoặc đã hết hạn'
			)
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Mã xác thực không chính xác hoặc đã hết hạn'
			})
		}

		//Tìm tài khoản
		const account =
			await this.accountRepository.findByEmail(normalizedEmail)
		if (!account) {
			this.logger.warn(
				{ email: normalizedEmail },
				'Đặt lại mật khẩu thất bại: Tài khoản không tồn tại'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Tài khoản không tồn tại'
			})
		}

		//Băm mật khẩu mới bằng Argon2id
		const passwordHash = await this.hashPasswordService.hash(newPassword)

		//Cập nhật mật khẩu trong DB
		await this.accountRepository.update(account.id, {
			passwordHash
		})

		//Xóa mã xác thực khỏi Redis (chỉ sử dụng 1 lần)
		await this.redisService.del(`password_reset:${normalizedEmail}`)

		// Thu hồi toàn bộ Refresh Token của tài khoản trên mọi thiết bị để vô hiệu hóa các phiên cũ
		await this.tokenService.revokeAllRefreshTokens(account.id)

		//Gửi thông báo email xác nhận mật khẩu đã thay đổi
		await this.messagingService.passwordChanged({
			email: normalizedEmail
		})

		this.logger.info(
			{ accountId: account.id, email: normalizedEmail },
			'Đặt lại mật khẩu thành công, đã thu hồi toàn bộ phiên và phát sự kiện thông báo'
		)

		return { ok: true }
	}
}
