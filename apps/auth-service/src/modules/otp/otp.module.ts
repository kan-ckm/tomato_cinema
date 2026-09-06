import { Global, Module } from '@nestjs/common'
import { RedisService } from '@/infrastructure/redis/redis.service'
import { OtpService } from './otp.service'

@Global()
@Module({
	providers: [OtpService, RedisService],
	exports: [OtpService]
})
export class OtpModule {}
