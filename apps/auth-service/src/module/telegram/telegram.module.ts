import { Module } from '@nestjs/common'
import { RedisService } from '@/infrastucture/redis/redis.service'
import { UserRepository } from '@/shared/repository'
import { TokenService } from '../token/token.service'
import { UsersModule } from '../users/users.module'
import { TelegramController } from './telegram.controller'
import { TelegramRepository } from './telegram.repository'
import { TelegramService } from './telegram.service'

@Module({
	imports: [UsersModule],
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
