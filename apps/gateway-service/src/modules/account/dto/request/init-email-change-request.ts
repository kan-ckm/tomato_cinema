import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class InitEmailChangeRequest {
	@ApiProperty({
		example: 'test@gmail.com'
	})
	//	@IsNotEmpty() đc dùng để bắt người dùng không được để trống
	@IsNotEmpty()
	@IsEmail()
	public email: string
}
