import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { convertEnum, RpcStatus } from '@tomatocinema/common'
import {
	ConfirmEmailChangeRequest,
	ConfirmPhoneChangeRequest,
	type GetAccountRequest,
	InitEmailChangeRequest,
	InitPhoneChangeRequest,
	RoleUser
} from '@tomatocinema/contracts/gen/account'
import { MessagingService } from '@/infrastucture/messaging/messaging.service'
import { UserRepository } from '@/shared/repository'
import { OtpService } from '../otp/otp.service'
import { AccountRepository } from './account.repository'

@Injectable()
export class AccountService {
	public constructor(
		private readonly messagingService: MessagingService,
		private readonly accountRepository: AccountRepository,
		private readonly userRepository: UserRepository,
		private readonly otpService: OtpService
	) {}
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
		const existing = await this.userRepository.findByEmail(email)

		if (existing)
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'email đã được sử dụng'
			})

		// Tạo và gửi mã OTP đến email mới
		const { code, hash } = await this.otpService.send(email, 'email')
		console.log('code email:', code)
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
		return { ok: true }
	}

	// Xác nhận việc thay đổi Email bằng mã OTP
	public async confirmEmailChange(data: ConfirmEmailChangeRequest) {
		const { email, code, userId } = data

		//Tìm yêu cầu đổi email đang chờ của user này
		const pending = await this.accountRepository.findPendingChange(
			userId,
			'email'
		)

		if (!pending)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Không có yêu cầu nào đang chờ xử lý'
			})

		if (pending.value !== email)
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Lỗi email'
			})

		if (pending.expiresAt < new Date())
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Code hết hạn'
			})

		this.otpService.verify(pending.value, code, 'email')

		// Nếu OTP đúng, tiến hành cập nhật email mới vào hồ sơ user và đánh dấu đã xác minh
		await this.userRepository.update(userId, {
			email,
			isEmailVerified: true
		})
		await this.accountRepository.deletePendingChange(userId, 'email')
		return { ok: true }
	}

	// Bắt đầu quy trình thay đổi Số điện thoại (Tương tự như đổi Email)

	public async initChangePhone(data: InitPhoneChangeRequest) {
		const { phone, userId } = data
		const existing = await this.userRepository.findByPhone(phone)

		if (existing)
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'số điện thoại đã được sử dụng'
			})
		const { code, hash } = await this.otpService.send(phone, 'phone')
		console.log('code phone:', code)
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
		return { ok: true }
	}

	public async confirmPhoneChange(data: ConfirmPhoneChangeRequest) {
		const { phone, code, userId } = data

		const pending = await this.accountRepository.findPendingChange(
			userId,
			'phone'
		)

		if (!pending)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Không có yêu cầu nào đang chờ xử lý'
			})

		if (pending.value !== phone)
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: 'Lỗi số điện thoại'
			})

		if (pending.expiresAt < new Date())
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Code hết hạn'
			})

		this.otpService.verify(pending.value, code, 'phone')

		await this.userRepository.update(userId, {
			phone,
			isPhoneVerified: true
		})
		await this.accountRepository.deletePendingChange(userId, 'phone')
		return { ok: true }
	}
}
