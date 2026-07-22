import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
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
						protoPath:
							'node_modules/@tomatocinema/contracts/proto/auth.proto',
						url: configService.getOrThrow<string>('AUTH_GRPC_URL')
					}
				})
			}
		])
	],
	controllers: [AuthController],
	providers: [AuthClientGrpc]
})
export class AuthModule {}
