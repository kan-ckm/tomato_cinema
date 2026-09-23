import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { databaseEnv, grpcUserEnv, rmqEnv } from './config'
import { grpcAuthEnv } from './config/env/grpc-auth-env'
import { DatabaseModule } from './infrastructure/database/database.module'
import { UsersModule } from './modules/users/users.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [grpcAuthEnv, grpcUserEnv, databaseEnv, rmqEnv]
		}),
		DatabaseModule,
		UsersModule
	]
})
export class AppModule {}
