import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import {
	ForgotPasswordRequest,
	ForgotPasswordResponse,
	ResetPasswordRequest,
	ResetPasswordResponse
} from '@tomatocinema/contracts/gen/auth'
import { MessagingService } from '@/infrastructure/messaging/messaging.service'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { AccountRepository } from '@/modules/account/repositories'
import { TokenService } from '@/modules/token/token.service'
import { UsersClientGrpc } from '@/modules/users/users.grpc'
import { HashPasswordService } from '@/shared/hash-password'

@Injectable()
export class ForgotPasswordService {
	//QUÊN MẬT KHẨU (GỬI MÃ QUA EMAIL)
	public constructor(
		private readonly accountRepository: AccountRepository,
		private readonly hashPasswordService: HashPasswordService,
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
		private readonly messagingService: MessagingService,
		private readonly usersClient: UsersClientGrpc
	) {}
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

	//ĐẶT LẠI MẬT KHẨU (BẰNG MÃ XÁC THỰC EMAIL)

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

		//Kiểm tra mã xác thực từ Redis
		const storedCode = await this.redisService.get(
			`password_reset:${normalizedEmail}`
		)

		if (!storedCode || storedCode !== code.trim()) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Mã xác thực không chính xác hoặc đã hết hạn'
			})
		}

		//Tìm tài khoản
		const account =
			await this.accountRepository.findByEmail(normalizedEmail)
		if (!account) {
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

		//Gửi thông báo email xác nhận mật khẩu đã thay đổi
		await this.messagingService.passwordChanged({
			email: normalizedEmail
		})

		return { ok: true }
	}

	//ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP

	// /**
	//  * Đổi mật khẩu chủ động cho người dùng đã đăng nhập
	//  */
	// public async changePassword(
	// 	data: ChangePasswordRequest
	// ): Promise<ChangePasswordResponse> {
	// 	const { userId, currentPassword, newPassword } = data

	// 	if (!userId || !currentPassword || !newPassword) {
	// 		throw new RpcException({
	// 			code: RpcStatus.INVALID_ARGUMENT,
	// 			details: 'Vui lòng cung cấp đầy đủ thông tin'
	// 		})
	// 	}

	// 	if (newPassword.length < 6) {
	// 		throw new RpcException({
	// 			code: RpcStatus.INVALID_ARGUMENT,
	// 			details: 'Mật khẩu mới phải có ít nhất 6 ký tự'
	// 		})
	// 	}

	// 	const account = await this.accountRepository.findById(userId)
	// 	if (!account || !account.passwordHash) {
	// 		throw new RpcException({
	// 			code: RpcStatus.NOT_FOUND,
	// 			details: 'Tài khoản không tồn tại'
	// 		})
	// 	}

	// 	//Kiểm tra mật khẩu hiện tại
	// 	const isCurrentValid = await this.passwordService.compare(
	// 		currentPassword,
	// 		account.passwordHash
	// 	)

	// 	if (!isCurrentValid) {
	// 		throw new RpcException({
	// 			code: RpcStatus.UNAUTHENTICATED,
	// 			details: 'Mật khẩu hiện tại không chính xác'
	// 		})
	// 	}

	// 	//Băm mật khẩu mới bằng Argon2id
	// 	const passwordHash = await this.passwordService.hash(newPassword)

	// 	//Cập nhật DB
	// 	await this.accountRepository.update(account.id, {
	// 		passwordHash
	// 	})

	// 	//Gửi email thông báo nếu tài khoản có email
	// 	if (account.email) {
	// 		await this.messagingService.passwordChanged({
	// 			email: account.email
	// 		})
	// 	}

	// 	return { ok: true }
	// }
}
