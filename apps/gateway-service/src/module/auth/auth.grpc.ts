import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	AuthServiceClient,
	RefreshRequest,
	SendOtpRequest,
	VerifyOtpRequest
} from '@tomatocinema/contracts/gen/auth'

// Controller đóng vai trò API Gateway:
// Tiếp nhận HTTP Request từ Client (người dùng), giao tiếp qua gRPC sang Auth-Service để xử lý logic, và trả
@Injectable()
export class AuthClientGrpc implements OnModuleInit {
	private authService?: AuthServiceClient

	public constructor(
		@Inject('AUTH_PACKAGE') private readonly client: ClientGrpc
	) {}
	public onModuleInit() {
		this.authService = this.client.getService('AuthService')
	}

	public sendOtp(request: SendOtpRequest) {
		return this.authService?.sendOtp(request)
	}

	public verifyOtp(request: VerifyOtpRequest) {
		return this.authService?.verifyOtp(request)
	}
	public refresh(request: RefreshRequest) {
		return this.authService?.refresh(request)
	}
}
