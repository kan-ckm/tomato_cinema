import { Module } from '@nestjs/common'
import { RedisService } from '@/infrastucture/redis/redis.service'
import { UserRepository } from '@/shared/repository'
import { TokenService } from '../token/token.service'
import { TelegramController } from './telegram.controller'
import { TelegramRepository } from './telegram.repository'
import { TelegramService } from './telegram.service'

@Module({
	controllers: [TelegramController],
	providers: [
		TelegramService,
		TelegramRepository,
		UserRepository,
		TokenService,
		RedisService
	]
})
export class TelegramModule {}
