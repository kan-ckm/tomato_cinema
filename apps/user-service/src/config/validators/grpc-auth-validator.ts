import { IsInt, IsString, Max, Min } from 'class-validator'

export class GrpcAuthValidator {
	@IsString()
	public GRPC_AUTH_HOST: string

	@IsInt()
	@Min(1)
	@Max(65535)
	public GRPC_AUTH_PORT: number
}
