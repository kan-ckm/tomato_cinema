import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportModule } from '@tomatocinema/passport'
import { AllConfig } from 'config/interfaces'
import { getPassportConfig } from 'config/loaders/pasport.config-loader'
import { RedisService } from '@/infrastucture/redis/redis.service'
import { OtpService } from '../otp/otp.service'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'

@Module({
	imports: [
		//Khởi tạo và cấu hình bất đồng bộ cho PassportModule
		PassportModule.registerAsync({
			useFactory: getPassportConfig,
			inject: [ConfigService]
		})
	],
	controllers: [AuthController],
	providers: [AuthService, AuthRepository, OtpService, RedisService]
})
export class AuthModule {}
