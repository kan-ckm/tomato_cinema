import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportModule } from '@tomatocinema/passport'
import { getPassportConfig } from 'config'
import { TokenService } from './token.service'

@Module({
	imports: [
		//Khởi tạo và cấu hình bất đồng bộ cho PassportModule
		PassportModule.registerAsync({
			useFactory: getPassportConfig,
			inject: [ConfigService]
		})
	],
	providers: [TokenService],
	exports: [TokenService]
})
export class TokenModule {}
