import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './infrastucture/prisma/prisma.module'
import { RedisModule } from './infrastucture/redis/redis.module'
import { AuthModule } from './module/auth/auth.module'
import { OtpModule } from './module/otp/otp.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		}),
		AuthModule,
		PrismaModule,
		RedisModule,
		OtpModule
	]
})
export class AppModule {}
