import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	CreateUserRequest,
	CreateUserResponse
} from '@tomatocinema/contracts/gen/users'
import { UsersService } from './users.service'

// gRPC Controller tiếp nhận các yêu cầu từ các microservices khác (như auth-service, gateway)

@Controller()
export class UsersController {
	public constructor(private readonly usersService: UsersService) {}

	@GrpcMethod('UsersService', 'CreateUser')
	public async create(data: CreateUserRequest): Promise<CreateUserResponse> {
		return await this.usersService.createUser(data)
	}
}
