import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	TelegramCompleteRequest,
	TelegramCompleteResponse,
	TelegramConsumeRequest,
	TelegramConsumeResponse,
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
	@GrpcMethod('AuthService', 'TelegramComplete')
	public async complete(
		data: TelegramCompleteRequest
	): Promise<TelegramCompleteResponse> {
		return this.telegramService.complete(data)
	}

	@GrpcMethod('AuthService', 'TelegramConsume')
	public async consume(
		data: TelegramConsumeRequest
	): Promise<TelegramConsumeResponse> {
		return this.telegramService.consumeSession(data)
	}
}
