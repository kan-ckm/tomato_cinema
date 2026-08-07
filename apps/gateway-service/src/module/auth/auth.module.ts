import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PROTO_PATHS } from '@tomatocinema/contracts'
import { AccountModule } from '../account/account.module'
import { AuthController } from './auth.controller'
import { AuthClientGrpc } from './auth.grpc'

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'AUTH_PACKAGE',
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'auth.v1',
						protoPath: PROTO_PATHS.AUTH,
						url: configService.getOrThrow<string>('AUTH_GRPC_URL')
					}
				})
			}
		]),
		AccountModule
	],
	controllers: [AuthController],
	providers: [AuthClientGrpc]
})
export class AuthModule {}
