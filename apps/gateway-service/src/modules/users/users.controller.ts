import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger'
import { CurrentUser, Protected } from '../../shared/decorators'
import { GetMeResponse, PatchUserRequest } from './dto'
import { UsersClientGrpc } from './users.grpc'

@Controller('users')
export class UsersControler {
	public constructor(private readonly client: UsersClientGrpc) {}

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
		const { user } = await this.client.call('getMe', {
			id: userId
		})
		return user
	}

	@ApiOperation({
		summary: 'Cập nhật thông tin của user',
		description: 'Cập nhật thông tin người dùng hiện tại'
	})
	@ApiBearerAuth()
	@Protected()
	@Patch('@me')
	@HttpCode(HttpStatus.OK)
	public async patchUser(
		@CurrentUser() userId: string,
		@Body() dto: PatchUserRequest
	) {
		return this.client.call('patchUser', { userId, ...dto })
	}
}
