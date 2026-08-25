import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	CreateUserRequest,
	UsersServiceClient
} from '@tomatocinema/contracts/gen/users'

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

	public createUser(request: CreateUserRequest) {
		return this.usersService?.createUser(request)
	}
}
