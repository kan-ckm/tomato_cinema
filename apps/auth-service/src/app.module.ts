import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { databaseEnv, grpcEnv, passportEnv } from 'config'
import { redisEnv } from 'config/env/redis-env'
import { PrismaModule } from './infrastucture/prisma/prisma.module'
import { RedisModule } from './infrastucture/redis/redis.module'
import { AuthModule } from './module/auth/auth.module'
import { OtpModule } from './module/otp/otp.module'

@Module({
	imports: [
		// nạp env và nạp env tôi tùy chỉnhchỉnh
		ConfigModule.forRoot({
			isGlobal: true,
			load: [grpcEnv, databaseEnv, redisEnv, passportEnv]
		}),
		AuthModule,
		PrismaModule,
		RedisModule,
		OtpModule
	]
})
export class AppModule {}
