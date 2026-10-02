import { Module } from '@nestjs/common'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { HashPasswordService } from '@/shared/hash-password'
import { OtpService } from '../otp/otp.service'
import { TokenModule } from '../token/token.module'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'
import { AccountRepository } from './repositories'

@Module({
	imports: [TokenModule],
	controllers: [AccountController],
	providers: [
		AccountService,
		AccountRepository,
		OtpService,
		RedisService,
		HashPasswordService
	],
	exports: [AccountRepository, AccountService]
})
export class AccountModule {}
