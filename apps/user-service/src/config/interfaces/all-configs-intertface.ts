import { DatabaseConfig } from './database-interface'
import { GrpcConfig } from './grpc-interface'

export interface AllConfigs {
	grpc: GrpcConfig
	database: DatabaseConfig
}
