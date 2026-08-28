import { Inject } from '@nestjs/common'
import { GRPC_CLIENT_PREFIX } from '../constants/grpc.constants'
import { GRPC_CLIENT } from '../registry/grpc.registry'

export const InjectGrpcClient = (
	token: keyof typeof GRPC_CLIENT | (string & {})
) => Inject(`${GRPC_CLIENT_PREFIX}_${token}`)
