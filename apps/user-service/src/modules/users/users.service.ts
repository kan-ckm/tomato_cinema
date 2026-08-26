import { Injectable } from '@nestjs/common'
import {
	CreateUserRequest,
	CreateUserResponse,
	GetMeRequest,
	GetMeResponse
} from '@tomatocinema/contracts/gen/users'
import { UserRepository } from 'src/shared/repository'

/**
 * Service xử lý nghiệp vụ người dùng (Profile, Account Information)
 */
@Injectable()
export class UsersService {
	public constructor(private readonly userRepository: UserRepository) {}

	public async getMe(data: GetMeRequest): Promise<{ ok: boolean }> {
		return { ok: true }
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
}
