import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsString, Validate } from 'class-validator'
import { IdentifierValidator } from '../../../../shared/validators'

export class SendOtpRequest {
	@ApiProperty({
		example: '0868261400'
	})
	@IsString()
	@Validate(IdentifierValidator)
	public identifier: string
	@ApiProperty({
		example: 'phone',
		enum: ['email', 'phone']
	})
	@IsEnum(['email', 'phone'])
	public type: 'email' | 'phone'
}
