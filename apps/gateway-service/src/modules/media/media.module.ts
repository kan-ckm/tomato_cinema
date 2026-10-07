import { Global, Module } from '@nestjs/common'
import { GrpcModule } from '@tomatocinema/common'
import { MediaController } from './media.controller'
import { MediaClientGrpc } from './media.grpc'

@Global()
@Module({
	imports: [GrpcModule.register(['MEDIA_PACKAGE'])],
	controllers: [MediaController],
	providers: [MediaClientGrpc],
	exports: [MediaClientGrpc]
})
export class MediaModule {}
