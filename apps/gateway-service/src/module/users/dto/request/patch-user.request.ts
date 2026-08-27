import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class PatchUserRequest {
	@ApiPropertyOptional({
		description: 'Họ và tên người dùng',
		example: 'Nguyễn Văn A',
		nullable: true
	})
	@IsString()
	@IsNotEmpty()
	public name: string
}
