import { Module } from '@nestjs/common'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { OtpService } from './otp.service'

@Module({
	providers: [OtpService, RedisService],
	exports: [OtpService]
})
export class OtpModule {}
