import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PROTO_PATHS } from '@tomatocinema/contracts'
import { AllConfigs } from 'src/config'
import { AccountClientGrpc } from 'src/infrastucture/grpc/clients/account.client'
import { UserEntity } from 'src/modules/users/entites'
import { UserRepository } from 'src/shared/repository'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		ClientsModule.registerAsync([
			{
				name: 'ACCOUNT_PACKAGE',
				inject: [ConfigService],
				useFactory: (configService: ConfigService<AllConfigs>) => ({
					transport: Transport.GRPC,
					options: {
						package: 'account.v1',
						protoPath: PROTO_PATHS.ACCOUNT,
						url: configService.get('grpc_auth.url', { infer: true })
					}
				})
			}
		])
	],
	controllers: [UsersController],
	providers: [UsersService, UserRepository, AccountClientGrpc]
})
export class UsersModule {}
