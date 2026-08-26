import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PROTO_PATHS } from '@tomatocinema/contracts'
import { UsersControler } from './users.controller'
import { UsersClientGrpc } from './users.grpc'

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'USERS_PACKAGE',
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'users.v1',
						protoPath: PROTO_PATHS.USERS,
						url: configService.getOrThrow<string>('USERS_GRPC_URL')
					}
				})
			}
		])
	],
	controllers: [UsersControler],
	providers: [UsersClientGrpc],
	exports: [UsersClientGrpc]
})
export class UsersModule {}
