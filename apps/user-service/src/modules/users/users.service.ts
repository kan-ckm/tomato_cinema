import { Injectable } from '@nestjs/common'
import {
	CreateUserRequest,
	CreateUserResponse
} from '@tomatocinema/contracts/gen/users'
import { UserRepository } from 'src/shared/repository'

@Injectable()
export class UsersService {
	public constructor(private readonly userRepository: UserRepository) {}

	public async createUser(
		data: CreateUserRequest
	): Promise<CreateUserResponse> {
		await this.userRepository.create({ id: data.id })
		return { ok: true }
	}
}
