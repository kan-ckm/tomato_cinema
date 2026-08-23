import { IsBoolean, IsInt, IsString, Max, Min } from 'class-validator'

export class DatabaseValidator {
	@IsString()
	public DATABASE_HOST: string
	@IsInt()
	@Min(1)
	@Max(65535)
	public DATABASE_PORT: number
	@IsString()
	public DATABASE_USERNAME: string
	@IsString()
	public DATABASE_PASSWORD: string
	@IsString()
	public DATABASE_USER: string
	@IsBoolean()
	public DATABASE_LOGGING: boolean
	@IsBoolean()
	public DATABASE_SYNC: boolean
}
