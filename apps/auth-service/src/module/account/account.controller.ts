import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	ConfirmEmailChangeRequest,
	ConfirmEmailChangeResponse,
	ConfirmPhoneChangeRequest,
	ConfirmPhoneChangeResponse,
	GetAccountRequest,
	GetAccountResponse,
	InitEmailChangeRequest,
	InitEmailChangeResponse,
	InitPhoneChangeRequest,
	InitPhoneChangeResponse
} from '@tomatocinema/contracts/gen/account'
import { AccountService } from './account.service'

@Controller()
export class AccountController {
	public constructor(private readonly accountService: AccountService) {}
	@GrpcMethod('AccountService', 'GetAccount')

	// Lắng nghe gRPC: Yêu cầu lấy thông tin tài khoản
	public async getAccount(
		data: GetAccountRequest
	): Promise<GetAccountResponse> {
		return await this.accountService.getAccount(data)
	}

	// Lắng nghe gRPC: Yêu cầu bắt đầu đổi Email
	@GrpcMethod('AccountService', 'InitEmailChange')
	public async initEmailChange(
		data: InitEmailChangeRequest
	): Promise<InitEmailChangeResponse> {
		return await this.accountService.initChangeEmail(data)
	}

	// Lắng nghe gRPC: Xác nhận mã OTP để chính thức đổi Email
	@GrpcMethod('AccountService', 'ConfirmEmailChange')
	public async confirmEmailChange(
		data: ConfirmEmailChangeRequest
	): Promise<ConfirmEmailChangeResponse> {
		return await this.accountService.confirmEmailChange(data)
	}

	// Lắng nghe gRPC: Yêu cầu bắt đầu đổi Số điện thoại
	@GrpcMethod('AccountService', 'InitPhoneChange')
	public async initPhoneChange(
		data: InitPhoneChangeRequest
	): Promise<InitPhoneChangeResponse> {
		return await this.accountService.initChangePhone(data)
	}

	// Lắng nghe gRPC: Xác nhận mã OTP để chính thức đổi Số điện thoại
	@GrpcMethod('AccountService', 'ConfirmPhoneChange')
	public async confirmPhoneChange(
		data: ConfirmPhoneChangeRequest
	): Promise<ConfirmPhoneChangeResponse> {
		return await this.accountService.confirmPhoneChange(data)
	}
}
