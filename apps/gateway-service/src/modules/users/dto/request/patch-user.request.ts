import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class PatchUserRequest {
	@ApiPropertyOptional({
		description: 'Họ và tên người dùng',
		example: 'Nguyễn Văn A',
		nullable: true
	})
	@IsString()
	@IsOptional()
	public name?: string

	@ApiPropertyOptional({
		description: 'Đường dẫn/khóa ảnh đại diện',
		example: 'users/avatar-123.jpg',
		nullable: true
	})
	@IsString()
	@IsOptional()
	public avatar?: string
}
