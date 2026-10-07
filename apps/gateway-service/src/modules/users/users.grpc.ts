import { Injectable } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@tomatocinema/common'
import { UsersServiceClient } from '@tomatocinema/contracts/gen/ts/users'
import { AbstractGrpcClient } from '../../shared/grpc'

@Injectable()
export class UsersClientGrpc extends AbstractGrpcClient<UsersServiceClient> {
	constructor(@InjectGrpcClient('USERS_PACKAGE') client: ClientGrpc) {
		super(client, 'UsersService')
	}
}
