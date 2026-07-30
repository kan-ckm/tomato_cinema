import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { AuthClientGrpc } from './auth.grpc'
import { SendOtpRequest, VerifyOtpRequest } from './dto'

@Controller('auth')
export class AuthController {
	public constructor(private readonly client: AuthClientGrpc) {}
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
	public async verifyOtp(@Body() dto: VerifyOtpRequest) {
		return this.client.verifyOtp(dto)
	}
}
