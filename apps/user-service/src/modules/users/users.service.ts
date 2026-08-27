import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import {
	CreateUserRequest,
	CreateUserResponse,
	GetMeRequest,
	GetMeResponse,
	PatchUserRequest
} from '@tomatocinema/contracts/gen/users'
import { AccountClientGrpc } from 'src/infrastucture/grpc/clients/account.client'
import { UserRepository } from 'src/shared/repository'

/**
 * Service xử lý nghiệp vụ người dùng (Profile, Account Information)
 */
@Injectable()
export class UsersService {
	public constructor(
		private readonly userRepository: UserRepository,
		private readonly accountClient: AccountClientGrpc
	) {}

	public async getMe(data: GetMeRequest): Promise<GetMeResponse> {
		const { id } = data
		const profile = await this.userRepository.findById(id)
		if (!profile)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Người dùng không tồn tại'
			})
		const account = await this.accountClient.getAccount({ id })

		return {
			user: {
				id: profile.id,
				name: profile.name ?? undefined,
				avatar: profile.avatar ?? undefined,
				phone: account.phone,
				email: account.email
			}
		}
	}

	/**
	 * Khởi tạo Profile người dùng mới với id được đồng bộ từ auth-service
	 */
	public async createUser(
		data: CreateUserRequest
	): Promise<CreateUserResponse> {
		await this.userRepository.create({ id: data.id })
		return { ok: true }
	}

	public async updateUser(data: PatchUserRequest) {
		const { userId, name } = data

		const user = await this.userRepository.findById(userId)

		if (!user)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'User not found'
			})

		await this.userRepository.update(user.id, {
			...(name !== undefined && { name })
		})

		return { ok: true }
	}
}
