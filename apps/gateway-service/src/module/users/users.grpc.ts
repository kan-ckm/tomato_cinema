import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import {
	GetMeRequest,
	UsersServiceClient
} from '@tomatocinema/contracts/gen/users'

// Controller đóng vai trò API Gateway:
// Tiếp nhận HTTP Request từ Client (người dùng), giao tiếp qua gRPC sang User-Service để xử lý logic, và trả
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

	public getMe(request: GetMeRequest) {
		return this.usersService?.getMe(request)
	}
}
