import { Module } from '@nestjs/common'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { AccountModule } from '../account/account.module'
import { TokenService } from '../token/token.service'
import { UsersModule } from '../users/users.module'
import { TelegramRepository } from './repositories/telegram.repository'
import { TelegramController } from './telegram.controller'
import { TelegramService } from './telegram.service'

@Module({
	imports: [AccountModule, UsersModule],
	controllers: [TelegramController],
	providers: [TelegramService, TelegramRepository, TokenService, RedisService]
})
export class TelegramModule {}
