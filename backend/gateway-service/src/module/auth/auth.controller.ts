import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { AuthClientGrpc } from './auth.grpc'
import { SendOtpRequest } from './dto'

@Controller('auth')
export class AuthController {
	public constructor(private readonly client: AuthClientGrpc) {}
	@ApiOperation({
		summary: 'Send otp code',
		description:
			'Sends a verification code to the user phone number or email'
	})
	@Post('otp/send')
	@HttpCode(HttpStatus.OK)
	public async sendOtp(@Body() dto: SendOtpRequest) {
		return this.client.sendOtp(dto)
	}
}
