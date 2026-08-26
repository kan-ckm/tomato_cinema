import { Body, Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger'
import { CurrentUser, Protected } from '../../shared/decorators'
import { GetMeResponse } from './dto'
import { UsersClientGrpc } from './users.grpc'

@Controller('users')
export class UsersControler {
	public constructor(
		private readonly client: UsersClientGrpc,
		private readonly configService: ConfigService
	) {}

	// API: Yêu cầu bắt đầu đổi Email
	@ApiOperation({
		summary: 'Lấy thông tin hiện tại của user',
		description: 'Trả về tất cả thông tin của user'
	})
	@ApiOkResponse({
		type: GetMeResponse
	})
	@ApiBearerAuth()
	@Protected()
	@Get('@me')
	@HttpCode(HttpStatus.OK)
	public async getMe(@CurrentUser() userId: string) {
		return this.client.getMe({
			id: userId
		})
	}
}
