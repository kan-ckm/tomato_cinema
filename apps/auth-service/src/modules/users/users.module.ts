import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PROTO_PATHS } from '@tomatocinema/contracts'
import { AllConfigs } from '@/config'
import { UsersClientGrpc } from '@/infrastructure/grpc/clients/users.client'

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'USERS_PACKAGE',
				inject: [ConfigService],
				useFactory: (configService: ConfigService<AllConfigs>) => ({
					transport: Transport.GRPC,
					options: {
						package: 'users.v1',
						protoPath: PROTO_PATHS.USERS,
						url: configService.get('grpc_user.url', { infer: true })
					}
				})
			}
		])
	],
	providers: [UsersClientGrpc],
	exports: [UsersClientGrpc]
})
export class UsersModule {}
