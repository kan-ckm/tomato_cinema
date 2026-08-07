import { Module } from '@nestjs/common'
import { RedisService } from '@/infrastucture/redis/redis.service'
import { UserRepository } from '@/shared/repository'
import { OtpService } from '../otp/otp.service'
import { AccountController } from './account.controller'
import { AccountRepositoty } from './account.repository'
import { AccountService } from './account.service'

@Module({
	imports: [],
	controllers: [AccountController],
	providers: [
		AccountService,
		AccountRepositoty,
		UserRepository,
		OtpService,
		RedisService
	]
})
export class AccountModule {}
