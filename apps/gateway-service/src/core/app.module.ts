import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@tomatocinema/passport'
import { AccountModule } from '../modules/account/account.module'
import { AuthModule } from '../modules/auth/auth.module'
import { MediaModule } from '../modules/media/media.module'
import { UsersModule } from '../modules/users/users.module'
import { ObservabilityModule } from '../observability/observability.module'
import { RateLimitModule } from '../shared/rate-limit/rate-limit.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { getPassportConfig } from './config'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		}),
		PassportModule.registerAsync({
			useFactory: getPassportConfig,
			inject: [ConfigService]
		}),
		AccountModule,
		AuthModule,
		UsersModule,
		MediaModule,
		ObservabilityModule,
		RateLimitModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
