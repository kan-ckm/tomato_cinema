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
import { MessagingModule } from './infrastucture/messaging/messaging.module'
import { PrismaModule } from './infrastucture/prisma/prisma.module'
import { RedisModule } from './infrastucture/redis/redis.module'
import { AccountModule } from './module/account/account.module'
import { AuthModule } from './module/auth/auth.module'
import { OtpModule } from './module/otp/otp.module'
import { TelegramModule } from './module/telegram/telegram.module'
import { TokenModule } from './module/token/token.module'
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
