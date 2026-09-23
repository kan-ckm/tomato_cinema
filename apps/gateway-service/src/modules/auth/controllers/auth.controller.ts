import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
	ApiBearerAuth,
	ApiOkResponse,
	ApiOperation,
	ApiTags
} from '@nestjs/swagger'
import { RoleUser } from '@tomatocinema/contracts/gen/account'
import type { Request, Response } from 'express'
import { CurrentUser, Protected } from '../../../shared/decorators'
import {
	ThrottleAuth,
	ThrottleOtp
} from '../../../shared/rate-limit/decorators'
import { AuthClientGrpc } from '../auth.grpc'
import {
	AuthResponse,
	ForgotPasswordRequest,
	LoginRequest,
	RegisterRequest,
	RegisterResponse,
	ResendVerificationRequest,
	ResetPasswordRequest,
	SuccessResponse,
	TelegramFinalizeRequest,
	TelegramVerifyRequest,
	VerifyEmailRequest
} from '../dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	public constructor(
		private readonly configService: ConfigService,
		private readonly client: AuthClientGrpc
	) {}

	// ==========================================
	// 1. ĐĂNG KÝ BẰNG EMAIL VÀ MẬT KHẨU (GỬI MÃ OTP)
	// ==========================================

	@ApiOperation({
		summary: 'Đăng ký tài khoản',
		description:
			'Đăng ký tài khoản mới bằng Email và Mật khẩu (gửi mã OTP xác thực)'
	})
	@ApiOkResponse({
		type: RegisterResponse,
		description: 'Đã gửi mã xác thực OTP về email của người dùng'
	})
	@ThrottleAuth()
	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	public async register(
		@Body() dto: RegisterRequest
	): Promise<RegisterResponse> {
		return await this.client.call('register', dto)
	}

	// ==========================================
	// 1.1. XÁC THỰC EMAIL BẰNG MÃ OTP
	// ==========================================

	@ApiOperation({
		summary: 'Xác thực Email đăng ký',
		description: 'Xác thực tài khoản bằng mã OTP 6 chữ số gửi qua Email'
	})
	@ApiOkResponse({
		type: AuthResponse,
		description:
			'Xác thực thành công, trả về Access Token và gán Refresh Token vào cookie'
	})
	@ThrottleOtp()
	@Post('verify-email')
	@HttpCode(HttpStatus.OK)
	public async verifyEmail(
		@Body() dto: VerifyEmailRequest,
		@Res({ passthrough: true }) res: Response
	) {
		const { accessToken, refreshToken } = await this.client.call(
			'verifyEmail',
			dto
		)

		this.setRefreshTokenCookie(res, refreshToken)

		return { accessToken }
	}

	// ==========================================
	// 1.2. GỬI LẠI MÃ XÁC THỰC EMAIL
	// ==========================================

	@ApiOperation({
		summary: 'Gửi lại mã xác thực Email',
		description: 'Gửi lại mã OTP xác thực email nếu mã cũ hết hạn'
	})
	@ApiOkResponse({
		type: SuccessResponse,
		description: 'Đã gửi lại mã xác thực thành công'
	})
	@ThrottleOtp()
	@Post('resend-verification')
	@HttpCode(HttpStatus.OK)
	public async resendVerification(@Body() dto: ResendVerificationRequest) {
		return await this.client.call('resendVerification', dto)
	}

	// ==========================================
	// 2. ĐĂNG NHẬP BẰNG EMAIL VÀ MẬT KHẨU
	// ==========================================

	@ApiOperation({
		summary: 'Đăng nhập tài khoản',
		description: 'Đăng nhập bằng Email và Mật khẩu'
	})
	@ApiOkResponse({
		type: AuthResponse,
		description:
			'Đăng nhập thành công, trả về Access Token và gán Refresh Token vào cookie'
	})
	@ThrottleAuth()
	@Post('login')
	@HttpCode(HttpStatus.OK)
	public async login(
		@Body() dto: LoginRequest,
		@Res({ passthrough: true }) res: Response
	) {
		const { accessToken, refreshToken } = await this.client.call(
			'login',
			dto
		)

		this.setRefreshTokenCookie(res, refreshToken)

		return { accessToken }
	}

	// ==========================================
	// 3. LÀM MỚI PHIÊN (REFRESH TOKEN ROTATION)
	// ==========================================

	@ApiOperation({
		summary: 'Làm mới Access Token',
		description:
			'Lấy Access Token mới bằng Refresh Token lưu trong HttpOnly Cookie'
	})
	@ApiOkResponse({
		type: AuthResponse
	})
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	public async refresh(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const refreshToken = req.cookies?.refreshToken

		if (!refreshToken) {
			throw new UnauthorizedException(
				'Không tìm thấy Refresh Token. Vui lòng đăng nhập lại.'
			)
		}

		const { accessToken, refreshToken: newRefreshToken } =
			await this.client.call('refresh', { refreshToken })

		this.setRefreshTokenCookie(res, newRefreshToken)

		return { accessToken }
	}

	// ==========================================
	// 4. ĐĂNG XUẤT (LOGOUT)
	// ==========================================

	@ApiOperation({
		summary: 'Đăng xuất',
		description: 'Xóa Refresh Token trong Cookie'
	})
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	public async logout(@Res({ passthrough: true }) res: Response) {
		res.cookie('refreshToken', '', {
			httpOnly: true,
			secure:
				this.configService.getOrThrow<string>('NODE_ENV') !==
				'development',
			domain: this.configService.getOrThrow<string>('COOKIE_DOMAIN'),
			sameSite: 'lax',
			expires: new Date(0)
		})
		return { ok: true }
	}

	// ==========================================
	// 5. THÔNG TIN ACCOUNT
	// ==========================================

	@ApiBearerAuth()
	@Protected(RoleUser.ADMIN)
	@Get('account')
	public async getAccount(@CurrentUser() userId: string) {
		return { id: userId }
	}

	// ==========================================
	// 6. QUÊN MẬT KHẨU (GỬI MÃ QUA EMAIL)
	// ==========================================

	@ApiOperation({
		summary: 'Yêu cầu đặt lại mật khẩu',
		description:
			'Gửi mã xác nhận gồm 6 chữ số đến email để đặt lại mật khẩu'
	})
	@ApiOkResponse({
		type: SuccessResponse,
		description: 'Đã gửi mã xác nhận qua email nếu email tồn tại'
	})
	@ThrottleOtp()
	@Post('forgot-password')
	@HttpCode(HttpStatus.OK)
	public async forgotPassword(@Body() dto: ForgotPasswordRequest) {
		return await this.client.call('forgotPassword', dto)
	}

	// ==========================================
	// 7. ĐẶT LẠI MẬT KHẨU (BẰNG MÃ EMAIL)
	// ==========================================

	@ApiOperation({
		summary: 'Đặt lại mật khẩu',
		description:
			'Đặt lại mật khẩu mới bằng mã xác thực 6 chữ số đã gửi qua email'
	})
	@ApiOkResponse({
		type: SuccessResponse,
		description: 'Đặt lại mật khẩu thành công'
	})
	@ThrottleAuth()
	@Post('reset-password')
	@HttpCode(HttpStatus.OK)
	public async resetPassword(@Body() dto: ResetPasswordRequest) {
		return await this.client.call('resetPassword', dto)
	}
	// ==========================================
	// 9. ĐĂNG NHẬP TELEGRAM (SSO)
	// ==========================================

	@ApiOperation({
		summary: 'Khởi tạo đăng nhập Telegram',
		description: 'Lấy URL widget đăng nhập Telegram'
	})
	@Get('telegram')
	@HttpCode(HttpStatus.OK)
	public async telegramInit() {
		return await this.client.call('telegramInit', {})
	}

	@ApiOperation({
		summary: 'Xác minh đăng nhập Telegram'
	})
	@Post('telegram/verify')
	@HttpCode(HttpStatus.OK)
	public async telegramVerify(
		@Body() dto: TelegramVerifyRequest,
		@Res({ passthrough: true }) res: Response
	) {
		const query = JSON.parse(atob(dto.tgAuthResult))
		const result = await this.client.call('telegramVerify', { query })

		if ('url' in result && result.url) return result

		if (result.accessToken && result.refreshToken) {
			this.setRefreshTokenCookie(res, result.refreshToken)
			return { accessToken: result.accessToken }
		}

		throw new UnauthorizedException(
			'Phản hồi đăng nhập telegram không hợp lệ'
		)
	}

	@ApiOperation({
		summary: 'Hoàn tất đăng nhập Telegram'
	})
	@Post('telegram/finalize')
	public async finalizeTelegramLogin(
		@Body() dto: TelegramFinalizeRequest,
		@Res({ passthrough: true }) res: Response
	) {
		const { sessionId } = dto
		const { accessToken, refreshToken } = await this.client.call(
			'telegramConsume',
			{ sessionId }
		)

		this.setRefreshTokenCookie(res, refreshToken)

		return { accessToken }
	}

	// ==========================================
	// HELPER: GÁN COOKIE BẢO MẬT
	// ==========================================

	private setRefreshTokenCookie(res: Response, refreshToken: string): void {
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure:
				this.configService.getOrThrow<string>('NODE_ENV') !==
				'development',
			domain: this.configService.getOrThrow<string>('COOKIE_DOMAIN'),
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000 // 30 ngày
		})
	}
}
