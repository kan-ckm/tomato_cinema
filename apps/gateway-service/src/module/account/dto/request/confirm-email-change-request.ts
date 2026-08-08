import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator'

export class ConfirmEmailChangeRequest {
	@ApiProperty({
		example: 'test@gmail.com'
	})
	//	@IsNotEmpty() đc dùng để bắt người dùng không được để trống
	@IsNotEmpty()
	@IsEmail()
	public email: string

	@ApiProperty({
		example: '123456'
	})
	@IsNotEmpty()
	@IsNumberString()
	@Length(6, 6)
	public code: string
}
