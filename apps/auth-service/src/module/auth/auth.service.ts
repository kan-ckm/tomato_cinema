import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import {
	RefreshRequest,
	SendOtpRequest,
	VerifyOtpRequest
} from '@tomatocinema/contracts/gen/auth'
import { Account, Prisma } from 'generated/client'
import { MessagingService } from '@/infrastucture/messaging/messaging.service'
import { UserRepository } from '@/shared/repository'
import { OtpService } from '../otp/otp.service'
import { TokenService } from '../token/token.service'
import { UsersClientGrpc } from '../users/users.grpc'

@Injectable()
export class AuthService {
	public constructor(
		private readonly userRepository: UserRepository,
		private readonly otpService: OtpService,
		private readonly tokenService: TokenService,
		private readonly messagingService: MessagingService,
		private readonly usersClient: UsersClientGrpc
	) {}

	/**
	 * Gửi mã OTP: Chỉ lưu tạm vào Redis, không tạo bản ghi trong Postgres
	 */
	public async sendOtp(data: SendOtpRequest) {
		const { identifier, type } = data
		this.assertValidType(type)

		const { code } = await this.otpService.send(
			identifier,
			type as 'phone' | 'email'
		)

		await this.messagingService.otpRequested({
			identifier,
			type,
			code
		})

		return { ok: true }
	}

	/**
	 * Xác thực OTP: Phân luồng đăng ký mới / đăng nhập lại, có bẫy race condition & rollback
	 */
	public async verifyOtp(data: VerifyOtpRequest) {
		const { identifier, type, code } = data
		this.assertValidType(type)

		// 1. Kiểm tra OTP từ Redis (sai sẽ throw lỗi ngay tại đây)
		await this.otpService.verify(
			identifier,
			code,
			type as 'phone' | 'email'
		)

		let account: Account | null = null
		let isNewAccount = false

		// 2. Tìm tài khoản hiện có
		if (type === 'phone') {
			account = await this.userRepository.findByPhone(identifier)
		} else {
			account = await this.userRepository.findByEmail(identifier)
		}

		// 3. Nếu chưa có -> Tạo tài khoản mới (Xử lý Race Condition Prisma P2002)
		if (!account) {
			isNewAccount = true
			try {
				account = await this.userRepository.create({
					phone: type === 'phone' ? identifier : undefined,
					email: type === 'email' ? identifier : undefined,
					isPhoneVerified: type === 'phone',
					isEmailVerified: type === 'email'
				})
			} catch (error: any) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002'
				) {
					account = (
						type === 'phone'
							? await this.userRepository.findByPhone(identifier)
							: await this.userRepository.findByEmail(identifier)
					)!
					isNewAccount = false
				} else {
					throw error
				}
			}
		}

		// 4. Đồng bộ tạo Profile sang user-service (CHỈ CHẠY KHI LÀ TÀI KHOẢN MỚI)
		if (isNewAccount && account) {
			try {
				await this.usersClient.create({ id: account.id })
			} catch (error) {
				// Rollback: Xóa tài khoản mồ côi nếu user-service gặp lỗi
				await this.userRepository.delete(account.id)
				throw new RpcException({
					code: RpcStatus.INTERNAL,
					details:
						'Khởi tạo hồ sơ người dùng thất bại. Vui lòng thử lại.'
				})
			}
		}

		// 5. Cập nhật tích xanh cho user cũ nếu trước đó chưa xác minh
		if (!isNewAccount && account) {
			if (type === 'phone' && !account.isPhoneVerified) {
				await this.userRepository.update(account.id, {
					isPhoneVerified: true
				})
			}
			if (type === 'email' && !account.isEmailVerified) {
				await this.userRepository.update(account.id, {
					isEmailVerified: true
				})
			}
		}

		// 6. Cấp Access Token và Refresh Token
		return this.tokenService.generate(account.id)
	}

	/**
	 * Cấp lại Access Token khi hết hạn
	 */
	public async refresh(data: RefreshRequest) {
		const { refreshToken } = data
		const result = this.tokenService.verify(refreshToken)

		if (!result.valid) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: result.reason
			})
		}

		return this.tokenService.generate(result.userId)
	}

	private assertValidType(type: string): asserts type is 'phone' | 'email' {
		if (type !== 'phone' && type !== 'email') {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: `Loại xác thực không hợp lệ: ${type}`
			})
		}
	}
}
