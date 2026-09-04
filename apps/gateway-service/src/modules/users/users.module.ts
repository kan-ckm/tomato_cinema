import { Global, Module } from '@nestjs/common'
import { GrpcModule } from '@tomatocinema/common'
import { UsersControler } from './users.controller'
import { UsersClientGrpc } from './users.grpc'

@Global()
@Module({
	imports: [GrpcModule.register(['USERS_PACKAGE'])],
	controllers: [UsersControler],
	providers: [UsersClientGrpc],
	exports: [UsersClientGrpc]
})
export class UsersModule {}
