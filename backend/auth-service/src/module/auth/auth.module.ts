import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'

@Module({
	controllers: [AuthController],
	providers: [AuthService, AuthRepository]
})
export class AuthModule {}
