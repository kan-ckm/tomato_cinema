import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { convertEnum, RpcStatus } from '@tomatocinema/common'
import {
	ConfirmEmailChangeRequest,
	ConfirmPasswordChangeRequest,
	ConfirmPhoneChangeRequest,
	type GetAccountRequest,
	InitEmailChangeRequest,
	InitPasswordChangeRequest,
	InitPhoneChangeRequest,
	RoleUser
} from '@tomatocinema/contracts/gen/ts/account'
import { PinoLogger } from 'nestjs-pino'
import { MessagingService } from '@/infrastructure/messaging/messaging.service'
import { HashPasswordService } from '../../shared/hash-password/hash-password.service'
import { OtpService } from '../otp/otp.service'
import { TokenService } from '../token/token.service'
import { AccountRepository } from './repositories'

@Injectable()
export class AccountService {
	public constructor(
		private readonly logger: PinoLogger,
		private readonly messagingService: MessagingService,
		private readonly accountRepository: AccountRepository,
		private readonly otpService: OtpService,
		private readonly hashPasswordService: HashPasswordService,
		private readonly tokenService: TokenService
	) {
		this.logger.setContext(AccountService.name)
	}

	// Lấy thông tin chi tiết của tài khoản dựa vào ID
	public async getAccount(data: GetAccountRequest) {
		const { id } = data
		const account = await this.accountRepository.findByIdUser(id)
		if (!account) {
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'tài khoản không tồn tại'
			})
		}
		// Trả về dữ liệu tài khoản đã được chuẩn hóa (chuyển đổi Enum role)
		return {
			id: account.id,
			phone: account.phone,
			email: account.email,
			isPhoneVerified: account.isPhoneVerified,
			isEmailVerified: account.isEmailVerified,
			role: convertEnum(RoleUser, account.role)
		}
	}

	// Bắt đầu quy trình thay đổi Email (Gửi yêu cầu đổi email)
	public async initChangeEmail(data: InitEmailChangeRequest) {
		const { email, userId } = data
		const existing = await this.accountRepository.findByEmail(email)

		if (existing) {
			this.logger.warn(
				{ email, userId },
				'Yêu cầu đổi email thất bại: Email đã được sử dụng'
			)
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'email đã được sử dụng'
			})
		}

		// Tạo và gửi mã OTP đến email mới
		const { code, hash } = await this.otpService.send(email, 'email')
		await this.messagingService.emailChanged({
			email,
			code
		})
		// Lưu thông tin yêu cầu thay đổi (Pending Change) vào database để chờ xác nhận, có hạn 5 phút
		await this.accountRepository.upsertPendingChange({
			accountId: userId,
			type: 'email',
			value: email,
			codeHash: hash,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000)
		})
		this.logger.info(
			{ email, userId },
			'Khởi tạo yêu cầu thay đổi email thành công'
		)
		return { ok: true }
	}

	// Xác nhận việc thay đổi Email bằng mã OTP
	public async confirmEmailChange(data: ConfirmEmailChangeRequest) {
		const { email, code, userId } = data

		// Tìm yêu cầu đổi email đang chờ của user này
		const pending = await this.accountRepository.findPendingChange(
			userId,
			'email'
		)

		if (!pending) {
			this.logger.warn(
				{ userId },
				'Xác nhận đổi email thất bại: Không có yêu cầu đang chờ'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Không có yêu cầu nào đang chờ xử lý'
			})
		}

		if (pending.value !== email) {
			this.logger.warn(
				{ userId, expected: pending.value, received: email },
				'Xác nhận đổi email thất bại: Sai email'
			)
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Lỗi email'
			})
		}

		if (pending.expiresAt < new Date()) {
			this.logger.warn(
				{ userId },
				'Xác nhận đổi email thất bại: Yêu cầu đã hết hạn'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Code hết hạn'
			})
		}

		await this.otpService.verify(pending.value, code, 'email')

		// Nếu OTP đúng, tiến hành cập nhật email mới vào hồ sơ user và đánh dấu đã xác minh
		await this.accountRepository.update(userId, {
			email,
			isEmailVerified: true
		})
		await this.accountRepository.deletePendingChange(userId, 'email')
		this.logger.info(
			{ email, userId },
			'Xác nhận và cập nhật email mới thành công'
		)
		return { ok: true }
	}

	// Bắt đầu quy trình thay đổi Số điện thoại (Tương tự như đổi Email)
	public async initChangePhone(data: InitPhoneChangeRequest) {
		const { phone, userId } = data
		const existing = await this.accountRepository.findByPhone(phone)

		if (existing) {
			this.logger.warn(
				{ phone, userId },
				'Yêu cầu đổi SĐT thất bại: Số điện thoại đã được sử dụng'
			)
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'số điện thoại đã được sử dụng'
			})
		}
		const { code, hash } = await this.otpService.send(phone, 'phone')
		await this.messagingService.phoneChanged({
			phone,
			code
		})
		await this.accountRepository.upsertPendingChange({
			accountId: userId,
			type: 'phone',
			value: phone,
			codeHash: hash,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000)
		})
		this.logger.info(
			{ phone, userId },
			'Khởi tạo yêu cầu thay đổi SĐT thành công'
		)
		return { ok: true }
	}

	public async confirmPhoneChange(data: ConfirmPhoneChangeRequest) {
		const { phone, code, userId } = data

		const pending = await this.accountRepository.findPendingChange(
			userId,
			'phone'
		)

		if (!pending) {
			this.logger.warn(
				{ userId },
				'Xác nhận đổi SĐT thất bại: Không có yêu cầu đang chờ'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Không có yêu cầu nào đang chờ xử lý'
			})
		}

		if (pending.value !== phone) {
			this.logger.warn(
				{ userId, expected: pending.value, received: phone },
				'Xác nhận đổi SĐT thất bại: Sai số điện thoại'
			)
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Lỗi số điện thoại'
			})
		}

		if (pending.expiresAt < new Date()) {
			this.logger.warn(
				{ userId },
				'Xác nhận đổi SĐT thất bại: Yêu cầu đã hết hạn'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Code hết hạn'
			})
		}

		await this.otpService.verify(pending.value, code, 'phone')

		await this.accountRepository.update(userId, {
			phone,
			isPhoneVerified: true
		})
		await this.accountRepository.deletePendingChange(userId, 'phone')
		this.logger.info(
			{ phone, userId },
			'Xác nhận và cập nhật SĐT mới thành công'
		)
		return { ok: true }
	}

	public async initChangePassword(data: InitPasswordChangeRequest) {
		const { currentPassword, userId } = data
		const account = await this.accountRepository.findById(userId)

		if (!account) {
			this.logger.warn(
				{ userId },
				'Yêu cầu đổi mật khẩu thất bại: Tài khoản không tồn tại'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'người dùng không tồn tại'
			})
		}

		if (!account.email) {
			this.logger.warn(
				{ userId },
				'Yêu cầu đổi mật khẩu thất bại: Thiếu email nhận mã'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Thiếu thông tin email để nhận mã xác nhận'
			})
		}
		const isPaswordValid = await this.hashPasswordService.compare(
			currentPassword,
			account.passwordHash
		)
		if (!isPaswordValid) {
			this.logger.warn(
				{ userId },
				'Yêu cầu đổi mật khẩu thất bại: Mật khẩu hiện tại không khớp'
			)
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Mật khẩu hiện tại không chính xác'
			})
		}

		const { code } = await this.otpService.send(account.email, 'email')

		await this.messagingService.passwordResetRequested({
			email: account.email,
			code,
			expiresInMinutes: 5
		})
		this.logger.info(
			{ userId },
			'Khởi tạo yêu cầu đổi mật khẩu và phát sự kiện gửi OTP'
		)
		return { ok: true }
	}

	public async confirmPasswordChange(data: ConfirmPasswordChangeRequest) {
		const { newPassword, code, userId } = data

		if (!newPassword || newPassword.length < 6) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Mật khẩu mới phải có 6 ký tự'
			})
		}

		const account = await this.accountRepository.findById(userId)
		if (!account || !account.email) {
			this.logger.warn(
				{ userId },
				'Xác nhận đổi mật khẩu thất bại: Tài khoản không hợp lệ'
			)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Tài khoản không hợp lệ'
			})
		}

		await this.otpService.verify(account.email, code, 'email')

		const newPasswodHash = await this.hashPasswordService.hash(newPassword)

		await this.accountRepository.update(userId, {
			passwordHash: newPasswodHash
		})

		// Thu hồi toàn bộ Refresh Token của tài khoản trên mọi thiết bị
		await this.tokenService.revokeAllRefreshTokens(userId)

		this.logger.info(
			{ userId },
			'Xác nhận đổi mật khẩu thành công và đã thu hồi tất cả phiên thiết bị'
		)
		return { ok: true }
	}
}
