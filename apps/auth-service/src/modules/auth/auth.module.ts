import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportModule } from '@tomatocinema/passport'
import { getPassportConfig } from '@/config'
import { AccountModule } from '../account/account.module'
import { TokenModule } from '../token/token.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './controllers/auth.controller'
import { AuthService } from './services/auth.service'
import { ForgotPasswordService } from './services/forgot-password.service'
import { PasswordService } from './services/hash-password.service'

/**
 * Module quản lý định danh & xác thực (Auth Module).
 * Tập hợp các dịch vụ đăng ký, đăng nhập email/mật khẩu, refresh token và quản lý mật khẩu.
 */
@Module({
	imports: [
		PassportModule.registerAsync({
			useFactory: getPassportConfig,
			inject: [ConfigService]
		}),
		AccountModule,
		TokenModule,
		UsersModule
	],
	controllers: [AuthController],
	providers: [AuthService, PasswordService, ForgotPasswordService],
	exports: [AuthService, PasswordService, ForgotPasswordService]
})
export class AuthModule {}
