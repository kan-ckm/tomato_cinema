import { Module } from '@nestjs/common'
import { GrpcModule } from '@tomatocinema/common'
import { AuthClientGrpc } from './auth.grpc'
import { AuthController } from './controllers/auth.controller'

@Module({
	imports: [GrpcModule.register(['AUTH_PACKAGE'])],
	controllers: [AuthController],
	providers: [AuthClientGrpc]
})
export class AuthModule {}
