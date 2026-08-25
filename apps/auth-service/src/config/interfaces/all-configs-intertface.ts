import { DatabaseConfig } from './database-interface'
import { GrpcAuthConfig } from './grpc-auth-interface'
import { GrpcUserConfig } from './grpc-user-interface'
import { PassportConfig } from './passport-interface'
import { RedisConfig } from './redis-interface'
import { RmqConfig } from './rmq.interface'
import { TelegramConfig } from './telegram-interface'

export interface AllConfigs {
	grpc_auth: GrpcAuthConfig
	grpc_user: GrpcUserConfig
	database: DatabaseConfig
	redis: RedisConfig
	passport: PassportConfig
	telegram: TelegramConfig
	rmq: RmqConfig
}
