import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	AccountServiceClient,
	ConfirmEmailChangeRequest,
	ConfirmPhoneChangeRequest,
	GetAccountRequest,
	InitEmailChangeRequest,
	InitPhoneChangeRequest
} from '@tomatocinema/contracts/gen/account'

// Controller đóng vai trò API Gateway:
// Tiếp nhận HTTP Request từ Client (người dùng), giao tiếp qua gRPC sang Account-Service để xử lý logic, và trả
@Injectable()
export class AccountClientGrpc implements OnModuleInit {
	private accountService?: AccountServiceClient

	public constructor(
		@Inject('ACCOUNT_PACKAGE') private readonly client: ClientGrpc
	) {}
	public onModuleInit() {
		this.accountService =
			this.client.getService<AccountServiceClient>('AccountService')
	}

	public getAccount(request: GetAccountRequest) {
		return this.accountService?.getAccount(request)
	}

	public initEmailChange(request: InitEmailChangeRequest) {
		return this.accountService?.initEmailChange(request)
	}

	public confirmEmailChange(request: ConfirmEmailChangeRequest) {
		return this.accountService?.confirmEmailChange(request)
	}
	public initPhoneChange(request: InitPhoneChangeRequest) {
		return this.accountService?.initPhoneChange(request)
	}

	public confirmPhoneChange(request: ConfirmPhoneChangeRequest) {
		return this.accountService?.confirmPhoneChange(request)
	}
}
