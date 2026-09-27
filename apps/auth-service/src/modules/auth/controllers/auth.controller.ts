import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	AuthResponse,
	ForgotPasswordRequest,
	ForgotPasswordResponse,
	LoginRequest,
	LogoutRequest,
	LogoutResponse,
	RefreshRequest,
	RefreshResponse,
	RegisterRequest,
	RegisterResponse,
	ResendVerificationRequest,
	ResendVerificationResponse,
	ResetPasswordRequest,
	ResetPasswordResponse,
	VerifyEmailRequest
} from '@tomatocinema/contracts/gen/auth'
import { AuthService } from '../services/auth.service'
import { ForgotPasswordService } from '../services/forgot-password.service'

/**
 * Controller tiếp nhận các yêu cầu gRPC cho AuthService từ API Gateway và các Service khác.
 */
@Controller()
export class AuthController {
	public constructor(
		private readonly authService: AuthService,
		private readonly forgotPasswordService: ForgotPasswordService
	) {}

	@GrpcMethod('AuthService', 'Register')
	public async register(data: RegisterRequest): Promise<RegisterResponse> {
		return await this.authService.register(data)
	}

	@GrpcMethod('AuthService', 'VerifyEmail')
	public async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
		return await this.authService.verifyEmail(data)
	}

	@GrpcMethod('AuthService', 'ResendVerification')
	public async resendVerification(
		data: ResendVerificationRequest
	): Promise<ResendVerificationResponse> {
		return await this.authService.resendVerification(data)
	}

	@GrpcMethod('AuthService', 'Login')
	public async login(data: LoginRequest): Promise<AuthResponse> {
		return await this.authService.login(data)
	}

	@GrpcMethod('AuthService', 'Refresh')
	public async refresh(data: RefreshRequest): Promise<RefreshResponse> {
		return await this.authService.refresh(data)
	}

	@GrpcMethod('AuthService', 'Logout')
	public async logout(data: LogoutRequest): Promise<LogoutResponse> {
		return await this.authService.logout(data)
	}

	@GrpcMethod('AuthService', 'ForgotPassword')
	public async forgotPassword(
		data: ForgotPasswordRequest
	): Promise<ForgotPasswordResponse> {
		return await this.forgotPasswordService.forgotPassword(data)
	}

	@GrpcMethod('AuthService', 'ResetPassword')
	public async resetPassword(
		data: ResetPasswordRequest
	): Promise<ResetPasswordResponse> {
		return await this.forgotPasswordService.resetPassword(data)
	}
}
