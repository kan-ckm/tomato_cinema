import { DynamicModule, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GRPC_CLIENT_PREFIX } from './constants/grpc.constants'
import { GrpcClientFactory } from './factory/grpc-client.factory'
import { GRPC_CLIENT } from './registry/grpc.registry'

@Module({})
export class GrpcModule {
	public static register(
		client: Array<keyof typeof GRPC_CLIENT>
	): DynamicModule {
		return {
			module: GrpcModule,
			providers: [
				GrpcClientFactory,
				...client.map(token => {
					const cfg = GRPC_CLIENT[token]

					return {
						provide: `${GRPC_CLIENT_PREFIX}_${token}`,
						inject: [GrpcClientFactory, ConfigService],
						useFactory: (
							factory: GrpcClientFactory,
							config: ConfigService
						) => {
							const url = config.getOrThrow(cfg.env)
							const client = factory.createClient({
								package: cfg.package,
								protoPath: cfg.protoPath,
								url
							})
							factory.register(token, client)

							return client
						}
					}
				})
			],
			exports: [
				GrpcClientFactory,
				...client.map(token => `${GRPC_CLIENT_PREFIX}_${token}`)
			]
		}
	}
}
