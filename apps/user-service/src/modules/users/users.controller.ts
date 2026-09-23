import { Controller, Logger } from '@nestjs/common'
import {
	Ctx,
	EventPattern,
	GrpcMethod,
	Payload,
	RmqContext
} from '@nestjs/microservices'
import type { AccountRegisteredEvent } from '@tomatocinema/contracts'
import type {
	CreateUserRequest,
	CreateUserResponse,
	GetMeRequest,
	GetMeResponse,
	PatchUserRequest,
	PatchUserResponse
} from '@tomatocinema/contracts/gen/users'
import { UsersService } from './users.service'

// gRPC Controller tiếp nhận các yêu cầu từ các microservices khác (như auth-service, gateway)

/**
 * Controller tiếp nhận cả giao tiếp gRPC và sự kiện bất đồng bộ RabbitMQ cho domain Users
 */
@Controller()
export class UsersController {
	private readonly logger = new Logger(UsersController.name)

	public constructor(private readonly usersService: UsersService) {}

	@GrpcMethod('UsersService', 'GetMe')
	public async getMe(data: GetMeRequest): Promise<GetMeResponse> {
		return await this.usersService.getMe(data)
	}

	@GrpcMethod('UsersService', 'CreateUser')
	public async create(data: CreateUserRequest): Promise<CreateUserResponse> {
		return await this.usersService.createUser(data)
	}

	@GrpcMethod('UsersService', 'PatchUser')
	public async patchUser(data: PatchUserRequest): Promise<PatchUserResponse> {
		return await this.usersService.updateUser(data)
	}

	/**
	 * Lắng nghe sự kiện đăng ký tài khoản thành công từ auth-service để tự động khởi tạo UserProfile
	 */
	@EventPattern('auth.account.registered')
	public async handleAccountRegistered(
		@Payload() data: AccountRegisteredEvent,
		@Ctx() ctx: RmqContext
	): Promise<void> {
		const channel = ctx.getChannelRef()
		const msg = ctx.getMessage()
		const event = 'auth.account.registered'

		try {
			this.logger.log(
				`Nhận sự kiện ${event} cho accountId: ${data.accountId}`
			)
			await this.usersService.createIfNotExists(data.accountId)
			channel.ack(msg)
			this.logger.log(
				`Đã tạo hồ sơ người dùng thành công cho accountId: ${data.accountId}`
			)
		} catch (error: any) {
			this.logger.error(
				`Lỗi khi xử lý sự kiện ${event} cho accountId: ${data.accountId}: ${error.message ?? error}`
			)
			// Nack không requeue nếu gặp lỗi nghiêm trọng
			channel.nack(msg, false, false)
		}
	}
}
