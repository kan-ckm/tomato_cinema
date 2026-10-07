import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger'
import { CurrentUser, Protected } from '../../shared/decorators'
import {
	uploadedAvater,
} from '../../shared/decorators/upload-avatar.decorator'
import { GetMeResponse, PatchUserRequest } from './dto'
import { UsersClientGrpc } from './users.grpc'

@Controller('users')
export class UsersController {
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

	@ApiBearerAuth()
	@UseInterceptors(FileInterceptor('file'))
	@Protected()
	@Patch('@me/avatar')
	@HttpCode(HttpStatus.OK)
	public async changeAvatar(
		@CurrentUser() userId: string,
		@uploadedAvater() file: Express.Multer.File
	) {
		// Logic upload qua media-service và update user profile sẽ viết ở đây
	}
}
