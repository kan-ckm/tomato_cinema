import { DatabaseConfig } from './database-interface'
import { GrpcConfig } from './grpc-interface'
import { PassportConfig } from './passport-interface'
import { RedisConfig } from './redis-interface'
import { TelegramConfig } from './telegram-interface'

export interface AllConfig {
	grpc: GrpcConfig
	database: DatabaseConfig
	redis: RedisConfig
	passport: PassportConfig
	telegram: TelegramConfig
}
