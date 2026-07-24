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
			if
		} catch (error) {
			throw new Error("Lỗi auth gửi otp", error);
		}
	}
}
