import { IsInt, IsString, Max, Min } from 'class-validator'

export class GrpcUserValidator {
	@IsString()
	public GRPC_USER_HOST: string

	@IsInt()
	@Min(1)
	@Max(65535)
	public GRPC_USER_PORT: number
}
