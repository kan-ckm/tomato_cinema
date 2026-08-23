import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { databaseEnv, grpcEnv } from './config'
import { DatabaseModule } from './infrastucture/database/database.module'
import { UsersModule } from './modules/users/users.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [grpcEnv, databaseEnv]
		}),
		DatabaseModule,
		UsersModule
	]
})
export class AppModule {}
