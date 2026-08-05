import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { lastValueFrom } from 'rxjs'
import { Protected } from '../../shared/decorators'
import { AuthGuard } from '../../shared/guards'
import { AuthClientGrpc } from './auth.grpc'
import { SendOtpRequest, VerifyOtpRequest } from './dto'

@Controller('auth')
// dùng trong việc nhận dữ liệu từ grpc và trả về cho client
export class AuthController {
	public constructor(
		private readonly configService: ConfigService,
		private readonly client: AuthClientGrpc
	) {}
	@ApiOperation({
		summary: 'gửi mã',
		description: 'Gửi mã xác minh đến số đt hoặc email người dùng'
	})
	@Post('otp/send')
	@HttpCode(HttpStatus.OK)
	public async sendOtp(@Body() dto: SendOtpRequest) {
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
		@Res({ passthrough: true }) res: Response
	) {
		const { accessToken, refreshToken } = await lastValueFrom(
			this.client.verifyOtp(dto)!
		)

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
		const refreshToken = await req.cookies?.refreshToken

		if (!refreshToken) {
			throw new UnauthorizedException(
				'Không tìm thấy Refresh Token. Vui lòng đăng nhập lại.'
			)
		}

		const { accessToken, refreshToken: newRefreshToken } =
			await lastValueFrom(this.client.refresh({ refreshToken })!)

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

	@ApiBearerAuth()
	@Protected()
	@Get('account')
	public async getAccount(@Req() req: any) {
		return { id: req.user.id }
	}
}
