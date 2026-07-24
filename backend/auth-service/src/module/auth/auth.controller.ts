import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	SendOtpRequest,
	SendOtpResponse
} from '@tomatocinema/contracts/gen/auth'
import { AuthService } from './auth.service'

@Controller()
export class AuthController {
	public constructor(private readonly authService: AuthService) {}

	@GrpcMethod('AuthService', 'SendOtp')
	public async sendOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
		return await this.sendOtp(data)
	}
}
