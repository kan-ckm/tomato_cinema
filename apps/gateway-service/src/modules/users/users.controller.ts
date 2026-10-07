import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOkResponse,
	ApiOperation
} from '@nestjs/swagger'
import { randomBytes } from 'crypto'
import { CurrentUser, Protected } from '../../shared/decorators'
import { uploadedAvater } from '../../shared/decorators/upload-avatar.decorator'
import { MediaClientGrpc } from '../media/media.grpc'
import { GetMeResponse, PatchUserRequest } from './dto'
import { UsersClientGrpc } from './users.grpc'

@Controller('users')
export class UsersController {
	public constructor(
		private readonly users: UsersClientGrpc,
		private readonly media: MediaClientGrpc
	) {}

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
		const { user } = await this.users.call('getMe', {
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
		return this.users.call('patchUser', { userId, ...dto })
	}

	@ApiOperation({
		summary: 'Cập nhật avatar user',
		description: 'Tải avatar user sau khi đăng nhập'
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Upload file ảnh',
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' }
			}
		}
	})
	@ApiBearerAuth()
	@UseInterceptors(FileInterceptor('file'))
	@Protected()
	@Patch('@me/avatar')
	@HttpCode(HttpStatus.OK)
	public async changeAvatar(
		@CurrentUser() userId: string,
		@uploadedAvater() file: Express.Multer.File
	) {
		// 1. Upload ảnh qua media-service gRPC
		const response = await this.media.call('upload', {
			fileName: `${randomBytes(16).toString('hex')}`,
			folder: 'users',
			contentType: file.mimetype,
			data: new Uint8Array(file.buffer),
			resizeWidth: 512,
			resizeHeight: 512
		})

		// 2. Cập nhật khóa avatar vào user-service
		return this.users.call('patchUser', { userId, avatar: response.key })
	}
}
