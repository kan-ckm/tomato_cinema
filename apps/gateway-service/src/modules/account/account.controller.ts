import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CurrentUser, Protected } from '../../shared/decorators'
import { ThrottleAuth, ThrottleOtp } from '../../shared/rate-limit'
import { AccountClientGrpc } from './account.grpc'
import {
	ConfirmEmailChangeRequest,
	ConfirmPasswordChangeRequest,
	ConfirmPhoneChangeRequest,
	InitEmailChangeRequest,
	InitPasswordChangeRequest,
	InitPhoneChangeRequest
} from './dto'

@Controller('account')
export class AccountController {
	public constructor(private readonly client: AccountClientGrpc) {}

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
		return this.client.call('initEmailChange', {
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
		return this.client.call('confirmEmailChange', {
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
		return this.client.call('initPhoneChange', {
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
		return this.client.call('confirmPhoneChange', {
			...dto,
			userId
		})
	}
	@ApiOperation({
		summary: 'Yêu cầu đổi mật khẩu',
		description: 'Kiểm tra mật khẩu cũ và gửi mã OTP về email'
	})
	@ApiBearerAuth()
	@Protected()
	@ThrottleOtp()
	@Post('password/init')
	@HttpCode(HttpStatus.OK)
	public async initPasswordChange(
		@Body() dto: InitPasswordChangeRequest,
		@CurrentUser() userId: string
	) {
		return this.client.call('initPasswordChange', {
			...dto,
			userId
		})
	}
	@ApiOperation({
		summary: 'Xác nhận đổi mật khẩu',
		description: 'Xác thực mã OTP và cập nhật mật khẩu mới'
	})
	@ApiBearerAuth()
	@Protected()
	@ThrottleAuth()
	@Post('password/confirm')
	@HttpCode(HttpStatus.OK)
	public async confirmPasswordChange(
		@Body() dto: ConfirmPasswordChangeRequest,
		@CurrentUser() userId: string
	) {
		return this.client.call('confirmPasswordChange', {
			...dto,
			userId
		})
	}
	// ==========================================
	// 8. ĐỔI MẬT KHẨU (KHI ĐÃ ĐĂNG NHẬP)
	// ==========================================

	// @ApiBearerAuth()
	// @Protected()
	// @ApiOperation({
	// 	summary: 'Đổi mật khẩu',
	// 	description:
	// 		'Đổi mật khẩu khi người dùng đã đăng nhập (cần mật khẩu hiện tại)'
	// })
	// @ApiOkResponse({
	// 	type: SuccessResponse,
	// 	description: 'Đổi mật khẩu thành công'
	// })
	// @ThrottleAuth()
	// @Post('change-password')
	// @HttpCode(HttpStatus.OK)
	// public async changePassword(
	// 	@CurrentUser() userId: string,
	// 	@Body() dto: ChangePasswordRequest
	// ) {
	// 	return await this.client.call('changePassword', { ...dto, userId })
	// }
}
