import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	CreateUserRequest,
	CreateUserResponse,
	UsersServiceClient
} from '@tomatocinema/contracts/gen/ts/users'
import { lastValueFrom } from 'rxjs'

// Client gRPC kết nối từ auth-service sang user-service

@Injectable()
export class UsersClientGrpc implements OnModuleInit {
	private usersService?: UsersServiceClient

	public constructor(
		@Inject('USERS_PACKAGE') private readonly client: ClientGrpc
	) {}

	public onModuleInit() {
		this.usersService =
			this.client.getService<UsersServiceClient>('UsersService')
	}

	public async create(
		request: CreateUserRequest
	): Promise<CreateUserResponse> {
		return await lastValueFrom(this.usersService.createUser(request))
	}
}
