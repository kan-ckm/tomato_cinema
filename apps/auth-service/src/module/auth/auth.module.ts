import { Module } from '@nestjs/common'
import { PassportModule } from '@tomatocinema/passport'
import { RedisService } from '@/infrastucture/redis/redis.service'
import { OtpService } from '../otp/otp.service'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'

@Module({
	imports: [
		PassportModule.register({
			secretKey: '123456'
		})
	],
	controllers: [AuthController],
	providers: [AuthService, AuthRepository, OtpService, RedisService]
})
export class AuthModule {}
