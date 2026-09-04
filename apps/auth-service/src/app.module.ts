import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import {
	databaseEnv,
	grpcAuthEnv,
	grpcUserEnv,
	passportEnv,
	redisEnv,
	rmqEnv,
	telegramEnv
} from '@/config'
import { MessagingModule } from './infrastructure/messaging/messaging.module'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { RedisModule } from './infrastructure/redis/redis.module'
import { AccountModule } from './modules/account/account.module'
import { AuthModule } from './modules/auth/auth.module'
import { OtpModule } from './modules/otp/otp.module'
import { TelegramModule } from './modules/telegram/telegram.module'
import { TokenModule } from './modules/token/token.module'
import { ObservabilityModule } from './observability/observability.module'

@Module({
	imports: [
		// load env and load custom env
		ConfigModule.forRoot({
			isGlobal: true,
			load: [
				databaseEnv,
				redisEnv,
				passportEnv,
				rmqEnv,
				telegramEnv,
				grpcAuthEnv,
				grpcUserEnv
			]
		}),
		AuthModule,
		PrismaModule,
		RedisModule,
		OtpModule,
		AccountModule,
		TelegramModule,
		TokenModule,
		MessagingModule,
		ObservabilityModule
	]
})
export class AppModule {}
