import { Injectable } from '@nestjs/common'
import { SendOtpRequest } from '@tomatocinema/contracts/gen/auth'
import { Account } from 'generated/client'
import { AuthRepository } from './auth.repository'

@Injectable()
export class AuthService {
	public constructor(private readonly authRepository: AuthRepository) {}

	public async sendOtp(data: SendOtpRequest) {
		try {
			const { identifier, type } = data
			let account: Account | null

			if (type === 'phone') {
				account = await this.authRepository.findByPhone(identifier)
			} else {
				account = await this.authRepository.findByEmail(identifier)
			}
			// nếu người dùng chx có thì hệ thống sẽ tự tạo cho họ một tài khoản mới
			if (!account) {
				account = await this.authRepository.create({
					phone: type === 'phone' ? identifier : undefined,
					email: type === 'email' ? identifier : undefined
				})
			}
			return { ok: true }
		} catch (error) {
			console.error('=== CHI TIẾT LỖI DATABASE ===', error)

			throw new Error(`Lỗi auth gửi otp: ${error.message}`)
		}
	}
}
