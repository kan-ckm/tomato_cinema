import { Global, Module } from '@nestjs/common'
import { GrpcModule } from '@tomatocinema/common'
import { AccountController } from './account.controller'
import { AccountClientGrpc } from './account.grpc'

@Global()
@Module({
	imports: [GrpcModule.register(['ACCOUNT_PACKAGE'])],
	controllers: [AccountController],
	providers: [AccountClientGrpc],
	exports: [AccountClientGrpc]
})
export class AccountModule {}
