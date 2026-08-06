import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PROTO_PATHS } from '@tomatocinema/contracts'
import { AccountController } from './account.controller'
import { AccountClientGrpc } from './account.grpc'

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'ACCOUNT_PACKAGE',
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'account.v1',
						protoPath: PROTO_PATHS.ACCOUNT,
						url: configService.getOrThrow<string>(
							'AUTH_GRPC_URL'
						)
					}
				})
			}
		])
	],
	providers: [AccountClientGrpc],
    exports: [AccountClientGrpc]
})
export class AccountModule {}
