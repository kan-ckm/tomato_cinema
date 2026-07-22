import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	AuthServiceClient,
	SendOtpRequest
} from '@tomatocinema/contracts/gen/auth'


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
}
