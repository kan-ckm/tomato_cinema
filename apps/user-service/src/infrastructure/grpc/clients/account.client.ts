import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	AccountServiceClient,
	GetAccountRequest,
	GetAccountResponse
} from '@tomatocinema/contracts/gen/ts/account'
import { lastValueFrom } from 'rxjs'

// Client gRPC kết nối từ auth-service sang user-service

@Injectable()
export class AccountClientGrpc implements OnModuleInit {
	private accountService: AccountServiceClient

	public constructor(
		@Inject('ACCOUNT_PACKAGE') private readonly client: ClientGrpc
	) {}

	public onModuleInit() {
		this.accountService =
			this.client.getService<AccountServiceClient>('AccountService')
	}

	public async getAccount(
		request: GetAccountRequest
	): Promise<GetAccountResponse> {
		return await lastValueFrom(this.accountService.getAccount(request))
	}
}
