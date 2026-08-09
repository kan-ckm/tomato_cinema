import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { databaseEnv, grpcEnv, passportEnv, telegramEnv } from 'config'
import { redisEnv } from 'config/env/redis-env'
import { PrismaModule } from './infrastucture/prisma/prisma.module'
import { RedisModule } from './infrastucture/redis/redis.module'
import { AccountModule } from './module/account/account.module'
import { AuthModule } from './module/auth/auth.module'
import { OtpModule } from './module/otp/otp.module'
import { TelegramModule } from './module/telegram/telegram.module'
import { TokenModule } from './module/token/token.module'

@Module({
	imports: [
		// load env and load custom env
		ConfigModule.forRoot({
			isGlobal: true,
			load: [grpcEnv, databaseEnv, redisEnv, passportEnv, telegramEnv]
		}),
		AuthModule,
		PrismaModule,
		RedisModule,
		OtpModule,
		AccountModule,
		TelegramModule,
		TokenModule
	]
})
export class AppModule {}
