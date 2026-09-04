import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, Matches } from 'class-validator'

export class InitPhoneChangeRequest {
	@ApiProperty({
		example: '0869273500'
	})
	//	@IsNotEmpty() đc dùng để bắt người dùng không được để trống
	@IsNotEmpty()
	@Matches(/^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/)
	public phone: string
}
