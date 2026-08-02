import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RpcException } from '@nestjs/microservices'
import {
	SendOtpRequest,
	VerifyOtpRequest
} from '@tomatocinema/contracts/gen/auth'
import { PassportService, TokenPayload } from '@tomatocinema/passport'
import { AllConfig } from 'config/interfaces'
import { Account } from 'generated/client'
import { OtpService } from '../otp/otp.service'
import { AuthRepository } from './auth.repository'

@Injectable()
export class AuthService {
	private readonly ACCESS_TOKEN_TTL: number
	private readonly REFRESH_TOKEN_TTL: number

	public constructor(
		private readonly configService: ConfigService<AllConfig>,
		private readonly authRepository: AuthRepository,
		private readonly otpService: OtpService,
		private readonly passportService: PassportService
	) {
		this.ACCESS_TOKEN_TTL = this.configService.get('passport.accessTtl', {
			infer: true
		})
		this.REFRESH_TOKEN_TTL = this.configService.get('passport.refreshTtl', {
			infer: true
		})
	}

	public async sendOtp(data: SendOtpRequest) {
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
		const code = await this.otpService.send(
			identifier,
			type as 'phone' | 'email'
		)
		console.debug('CODE', code)
		return { ok: true }
	}
	// hàm xác thực otp
	public async verifyOtp(data: VerifyOtpRequest) {
		const { identifier, type, code } = data
		// check xem mã otp có đúng hay ko
		await this.otpService.verify(
			identifier,
			code,
			type as 'phone' | 'email'
		)
		let account: Account | null

		// check xem acount có trong db hay ko

		if (type === 'phone') {
			account = await this.authRepository.findByPhone(identifier)
		} else {
			account = await this.authRepository.findByEmail(identifier)
		}
		if (!account) {
			throw new RpcException({
				code: 5,
				details: 'không tìm thấy tài khoản'
			})
		}
		// kiểm tra xem đã được xác minh hay chưa nếu chưa nếu chưa thì cho xác mình thành true nếu rồi thì skip đi tiếp
		if (type === 'phone' && !account.isPhoneVerified) {
			await this.authRepository.update(account.id, {
				isPhoneVerified: true
			})
		}
		if (type === 'email' && !account.isEmailVerified) {
			await this.authRepository.update(account.id, {
				isEmailVerified: true
			})
		}

		return this.getnerateTokens(account.id)
	}
	// gọi hàm tạo accessToken và refreshToken
	private getnerateTokens(userId: string) {
		const payload: TokenPayload = { sub: userId }

		const accessToken = this.passportService.generate(
			String(payload.sub),
			this.ACCESS_TOKEN_TTL
		)
		const refreshToken = this.passportService.generate(
			String(payload.sub),
			this.REFRESH_TOKEN_TTL
		)

		return { accessToken, refreshToken }
	}
}
