import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getTypeOrmConfig } from './typeorm.config'

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: getTypeOrmConfig,
			inject: [ConfigService]
		})
	]
})
export class DatabaseModule {}
