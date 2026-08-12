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
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { RoleUser } from '@tomatocinema/contracts/gen/account'
import type { Request, Response } from 'express'
import { lastValueFrom } from 'rxjs'
import { CurrentUser, Protected } from '../../shared/decorators'
import { AuthClientGrpc } from './auth.grpc'
import {
	SendOtpRequest,
	TelegramFinalizeRequest,
	TelegramVerifyRequest,
	VerifyOtpRequest
} from './dto'

@Controller('auth')
// API Gateway: Dùng trong việc nhận dữ liệu HTTP từ Client,
// đẩy sang cho gRPC nội bộ xử lý, và quản lý token (Cookie) trả về.
export class AuthController {
	public constructor(
		private readonly configService: ConfigService,
		private readonly client: AuthClientGrpc // Cầu nối gRPC gọi sang Auth Service
	) {}

	// LUỒNG ĐĂNG NHẬP OTP (PASSWORDLESS)

	@ApiOperation({
		summary: 'gửi mã',
		description: 'Gửi mã xác minh đến số đt hoặc email người dùng'
	})
	@Post('otp/send')
	@HttpCode(HttpStatus.OK)
	public async sendOtp(@Body() dto: SendOtpRequest) {
		// Giao việc gửi OTP cho Auth Service xử lý
		return this.client.sendOtp(dto)
	}

	@ApiOperation({
		summary: 'xác minh mã otp',
		description:
			'Xác minh mã từ user xem coi là điện hoại hay email và trả về access token cho user'
	})
	@Post('otp/verify')
	@HttpCode(HttpStatus.OK)
	public async verifyOtp(
		@Body() dto: VerifyOtpRequest,
		@Res({ passthrough: true }) res: Response // passthrough: true để NestJS tự lo việc return
	) {
		// Lấy cặp token từ Auth Service (gRPC) trả về
		const { accessToken, refreshToken } = await lastValueFrom(
			this.client.verifyOtp(dto)!
		)

		// Nhét Refresh Token vào Cookie bảo mật (Giấu không cho JS ở Frontend đọc được)
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true, // Chống hacker đánh cắp (XSS)
			secure:
				this.configService.getOrThrow<string>('NODE_ENV') !==
				'development', // Chỉ bật HTTPS khi đẩy lên server thật
			domain: this.configService.getOrThrow<string>('COOKIE_DOMAIN'),
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000 // Hạn sống 30 ngày
		})

		// Chỉ nhả Access Token ra Body cho Frontend lưu vào RAM dùng tạm
		return { accessToken }
	}

	// LUỒNG QUẢN LÝ PHIÊN (TOKEN)

	@ApiOperation({
		summary: 'Tạo mới lại access token',
		description: 'Làm mới lại access token bằng refresh token'
	})
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	public async refresh(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		// Móc Refresh Token từ Cookie mà Frontend tự động gửi lên
		const refreshToken = await req.cookies?.refreshToken

		// Chặn cửa ngay nếu không có Token
		if (!refreshToken) {
			throw new UnauthorizedException(
				'Không tìm thấy Refresh Token. Vui lòng đăng nhập lại.'
			)
		}

		// Xin Auth Service cấp cặp token mới
		const { accessToken, refreshToken: newRefreshToken } =
			await lastValueFrom(this.client.refresh({ refreshToken })!)

		// Cập nhật lại Cookie bằng Refresh Token mới (Refresh Token Rotation)
		res.cookie('refreshToken', newRefreshToken, {
			httpOnly: true,
			secure:
				this.configService.getOrThrow<string>('NODE_ENV') !==
				'development',
			domain: this.configService.getOrThrow<string>('COOKIE_DOMAIN'),
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000
		})
		return { accessToken }
	}

	@ApiOperation({
		summary: 'logout',
		description: 'xóa refresh token trong cookie và rồi logout người dùng'
	})
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	public async logout(@Res({ passthrough: true }) res: Response) {
		// Ghi đè Cookie bằng chuỗi rỗng và ép hạn sử dụng về 0 để trình duyệt tự xóa
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

	//LUỒNG BẢO VỆ & LẤY THÔNG TIN

	@ApiBearerAuth() // Hiển thị ổ khóa trên Swagger
	@Protected(RoleUser.ADMIN) // Bắt buộc phải là ADMIN mới được gọi API này
	@Get('account')
	public async getAccount(@CurrentUser() userId: string) {
		// @CurrentUser tự động moi ID từ Access Token ra
		return { id: userId }
	}

	// LUỒNG ĐĂNG NHẬP TELEGRAM (OAUTH/SSO)

	@Get('telegram')
	@HttpCode(HttpStatus.OK)
	public async telegramInit() {
		// Lấy link Bot Telegram từ Auth Service trả về cho Frontend
		return this.client.telegramInit()
	}

	@Post('telegram/verify')
	@HttpCode(HttpStatus.OK)
	public async telegramVerify(
		@Body() dto: TelegramVerifyRequest,
		@Res({ passthrough: true }) res: Response
	) {
		// Giải mã cục dữ liệu base64 mà Telegram trả về
		const query = JSON.parse(atob(dto.tgAuthResult))

		// Gửi qua Auth Service để đối chiếu chữ ký
		const result = await lastValueFrom(
			this.client.telegramVerify({ query })!
		)

		// Nếu User là người mới/chưa có sđt -> Trả về URL để ép ra Telegram Bot cung cấp SĐT
		if ('url' in result && result.url) return result

		// Nếu User cũ (đã có Token) -> Thiết lập Cookie y hệt luồng OTP
		if (result.accessToken && result.refreshToken) {
			const { accessToken, refreshToken } = result

			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				secure:
					this.configService.getOrThrow<string>('NODE_ENV') !==
					'development',
				domain: this.configService.getOrThrow<string>('COOKIE_DOMAIN'),
				sameSite: 'lax',
				maxAge: 30 * 24 * 60 * 60 * 1000
			})
			return { accessToken }
		}

		throw new UnauthorizedException(
			'Phản hồi đăng nhập telegram không hợp lệ'
		)
	}

	@Post('telegram/finalize')
	public async finalizeTelegramLogin(
		@Body() dto: TelegramFinalizeRequest,
		@Res({ passthrough: true }) res: Response
	) {
		const { sessionId } = dto

		//User đã lên Bot cấp SĐT xong, mang sessionId đi lấy Token thật
		const { accessToken, refreshToken } = await lastValueFrom(
			this.client.telegramConsume({ sessionId })!
		)

		// Set Cookie bảo mật và cho phép đăng nhập thành công
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure:
				this.configService.getOrThrow<string>('NODE_ENV') !==
				'development',
			domain: this.configService.getOrThrow<string>('COOKIE_DOMAIN'),
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000
		})
		return { accessToken }
	}
}
