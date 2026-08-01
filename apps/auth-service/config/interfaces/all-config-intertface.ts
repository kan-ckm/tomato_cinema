import { DatabaseConfig } from './database-interface'
import { GrpcConfig } from './grpc-interface'
import { RedisConfig } from './redis-interface'

export interface AllConfig {
	grpc: GrpcConfig
	database: DatabaseConfig
	redis: RedisConfig
}
