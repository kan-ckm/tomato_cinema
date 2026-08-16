import { DatabaseConfig } from './database-interface'
import { GrpcConfig } from './grpc-interface'
import { PassportConfig } from './passport-interface'
import { RedisConfig } from './redis-interface'
import { RmqConfig } from './rmq.interface'
import { TelegramConfig } from './telegram-interface'

export interface AllConfigs {
	grpc: GrpcConfig
	database: DatabaseConfig
	redis: RedisConfig
	passport: PassportConfig
	telegram: TelegramConfig
	rmq: RmqConfig
}
