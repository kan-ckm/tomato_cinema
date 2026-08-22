import { IsInt, IsString, Max, Min } from 'class-validator'

export class GrpcValidator {
	@IsString()
	public GRPC_HOST: string

	@IsInt()
	@Min(1)
	@Max(65535)
	public GRPC_PORT: number
}
