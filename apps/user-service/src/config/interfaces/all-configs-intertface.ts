import { DatabaseConfig } from './database-interface'
import { GrpcAuthConfig } from './grpc-auth-interface'
import { GrpcUserConfig } from './grpc-user-interface'
import { RmqConfig } from './rmq-interface'

export interface AllConfigs {
	grpc_user: GrpcUserConfig
	database: DatabaseConfig
	grpc_auth: GrpcAuthConfig
	rmq: RmqConfig
}
