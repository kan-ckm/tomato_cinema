import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './infrastucture/prisma/prisma.module'
import { AuthModule } from './module/auth/auth.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		}),
		AuthModule,
		PrismaModule
	]
})
export class AppModule {}
