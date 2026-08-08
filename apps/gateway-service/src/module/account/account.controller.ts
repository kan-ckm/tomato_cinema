import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CurrentUser, Protected } from '../../shared/decorators'
import { AccountClientGrpc } from './account.grpc'
import { ConfirmEmailChangeRequest, ConfirmPhoneChangeRequest, InitEmailChangeRequest, InitPhoneChangeRequest } from './dto'

@Controller('account')
export class AccountControler {
	public constructor(
		private readonly client: AccountClientGrpc,
		private readonly configService: ConfigService
	) {}

	// API: Yêu cầu bắt đầu đổi Email
	@ApiOperation({
		summary: 'Thay đổi email',
		description: 'Gửi mã xác nhận đến email mới'
	})
	@ApiBearerAuth()
	@Protected()
	@Post('email/init')
	@HttpCode(HttpStatus.OK)
	public async initEmailChange(
		@Body() dto: InitEmailChangeRequest,
		@CurrentUser() userId: string
	) {
		return this.client.initEmailChange({
			...dto,
			userId
		})
	}

	// API: Xác nhận mã OTP để đổi Email
	@ApiOperation({
		summary: 'xác nhận thay đổi email',
		description: 'xác minh mã xác nhận và cập nhật email người dùng'
	})
	@ApiBearerAuth()
	@Protected()
	@Post('email/confirm')
	@HttpCode(HttpStatus.OK)
	public async confirmEmailChange(
		@Body() dto: ConfirmEmailChangeRequest,
		@CurrentUser() userId: string
	) {
		return this.client.confirmEmailChange({
			...dto,
			userId
		})
	}

// API: Yêu cầu bắt đầu đổi Số điện thoại
	@ApiOperation({
		summary: 'Thay đổi phone',
		description: 'Gửi mã xác nhận đến số điện thoại mới'
	})
	@ApiBearerAuth()
	@Protected()
	@Post('phone/init')
	@HttpCode(HttpStatus.OK)
	public async initPhoneChange(
		@Body() dto: InitPhoneChangeRequest,
		@CurrentUser() userId: string
	) {
		return this.client.initPhoneChange({
			...dto,
			userId
		})
	}

	// API: Xác nhận mã OTP để đổi Số điện thoại
	@ApiOperation({
		summary: 'xác nhận thay đổi phone',
		description: 'xác minh mã xác nhận và cập nhật số điện thoại người dùng'
	})
	@ApiBearerAuth()
	@Protected()
	@Post('phone/confirm')
	@HttpCode(HttpStatus.OK)
	public async confirmPhoneChange(
		@Body() dto: ConfirmPhoneChangeRequest,
		@CurrentUser() userId: string
	) {
		return this.client.confirmPhoneChange({
			...dto,
			userId
		})
	}
}
