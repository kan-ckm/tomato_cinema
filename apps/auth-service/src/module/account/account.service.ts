import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { convertEnum, RpcStatus } from '@tomatocinema/common'
import {
	type GetAccountRequest,
	RoleUser
} from '@tomatocinema/contracts/gen/account'
import { AccountRepositoty } from './account.repository'

@Injectable()
export class AccountService {
	public constructor(private readonly accountRepositoty: AccountRepositoty) {}

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
}
