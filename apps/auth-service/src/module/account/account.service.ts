import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { convertEnum, RpcStatus } from '@tomatocinema/common'
import {
	type GetAccountRequest,
	InitEmailChangeRequest,
	RoleUser
} from '@tomatocinema/contracts/gen/account'
import { UserRepository } from '@/shared/repository'
import { OtpService } from '../otp/otp.service'
import { AccountRepositoty } from './account.repository'

@Injectable()
export class AccountService {
	public constructor(
		private readonly accountRepositoty: AccountRepositoty,
		private readonly userRepository: UserRepository,
		private readonly otpService: OtpService
	) {}

	public async getAccount(data: GetAccountRequest) {
		const { id } = data
		const account = await this.accountRepositoty.findByIdUser(id)
		if (!account) {
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'tài khoản không tồn tại'
			})
		}
		return {
			id: account.id,
			phone: account.phone,
			email: account.email,
			isPhoneVerified: account.isPhoneVerified,
			isEmailVerified: account.isEmailVerified,
			role: convertEnum(RoleUser, account.role)
		}
	}
	public async initChangeEmail(data: InitEmailChangeRequest) {
		const { email, userId } = data
		const existing = await this.userRepository.findByEmail(email)

		if (existing)
			throw new RpcException({
				code: RpcStatus.ALREADY_EXISTS,
				details: 'email đã được sử dụng'
			})
		const {} = await this.otpService.send(email, 'email')
	}
}
