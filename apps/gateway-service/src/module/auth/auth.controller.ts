import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Res
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiOperation } from '@nestjs/swagger'
import type { Response } from 'express'
import { lastValueFrom } from 'rxjs'
import { AuthClientGrpc } from './auth.grpc'
import { SendOtpRequest, VerifyOtpRequest } from './dto'

@Controller('auth')
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
	@Post('otp/Verify')
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
}
