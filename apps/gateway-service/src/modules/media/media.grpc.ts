import { Injectable } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@tomatocinema/common'
import { MediaServiceClient } from '@tomatocinema/contracts/gen/ts/media'
import { AbstractGrpcClient } from '../../shared/grpc'

@Injectable()
export class MediaClientGrpc extends AbstractGrpcClient<MediaServiceClient> {
	constructor(@InjectGrpcClient('MEDIA_PACKAGE') client: ClientGrpc) {
		super(client, 'MediaService')
	}
}
