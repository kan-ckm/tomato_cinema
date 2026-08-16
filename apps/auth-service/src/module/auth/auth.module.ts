import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportModule } from '@tomatocinema/passport'
import { getPassportConfig } from 'config/loaders/pasport.config-loader'
import { UserRepository } from '@/shared/repository'
import { OtpService } from '../otp/otp.service'
import { TokenService } from '../token/token.service'
import { AuthController } from './auth.controller'
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
	providers: [AuthService, OtpService, UserRepository, TokenService]
})
export class AuthModule {}
