import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@tomatocinema/passport'
import { AuthModule } from '../module/auth/auth.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { getPassportConfig } from './config'
import { AccountModule } from '../module/account/account.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		}),
		AuthModule,
		PassportModule.registerAsync({
			useFactory: getPassportConfig,
			inject: [ConfigService]
		}),
		AuthModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
