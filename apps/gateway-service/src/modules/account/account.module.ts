import { Global, Module } from '@nestjs/common'
import { GrpcModule } from '@tomatocinema/common'
import { AccountControler } from './account.controller'
import { AccountClientGrpc } from './account.grpc'

@Global()
@Module({
	imports: [GrpcModule.register(['ACCOUNT_PACKAGE'])],
	controllers: [AccountControler],
	providers: [AccountClientGrpc],
	exports: [AccountClientGrpc]
})
export class AccountModule {}
