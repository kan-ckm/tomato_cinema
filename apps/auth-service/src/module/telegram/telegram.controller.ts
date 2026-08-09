import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	TelegramInitResponse,
	TelegramVerifyRequest,
	TelegramVerifyResponse
} from '@tomatocinema/contracts/gen/auth'
import { TelegramService } from './telegram.service'

// Khai báo đây là một Controller
// Khác với HTTP (thường có @Controller('telegram')), với gRPC chúng ta để trống vì gRPC định tuyến
@Controller()
export class TelegramController {
	public constructor(private readonly telegramService: TelegramService) {}
	@GrpcMethod('AuthService', 'TelegramInit')
	public async getAuthUrl(): Promise<TelegramInitResponse> {
		return this.telegramService.getAuthUrl()
	}
	@GrpcMethod('AuthService', 'TelegramVerify')
	public async verify(
		data: TelegramVerifyRequest
	): Promise<TelegramVerifyResponse> {
		return this.telegramService.verify(data)
	}
}
