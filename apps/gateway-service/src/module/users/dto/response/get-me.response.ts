import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class GetMeResponse {
	@ApiProperty({
		description: 'ID người dùng',
		example: '0190a5b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b'
	})
	public id: string

	@ApiPropertyOptional({
		description: 'Họ và tên người dùng',
		example: 'Nguyễn Văn A',
		nullable: true
	})
	public name?: string

	@ApiPropertyOptional({
		description: 'Số điện thoại người dùng',
		example: '0869273500',
		nullable: true
	})
	public phone?: string

	@ApiPropertyOptional({
		description: 'Địa chỉ email người dùng',
		example: 'user@example.com',
		nullable: true
	})
	public email?: string

	@ApiPropertyOptional({
		description: 'Đường dẫn ảnh đại diện',
		example:
			'https://i.pinimg.com/736x/96/3a/b3/963ab34ed6a76b964f97fb70c73bef37.jpg',
		nullable: true
	})
	public avatar?: string
}
