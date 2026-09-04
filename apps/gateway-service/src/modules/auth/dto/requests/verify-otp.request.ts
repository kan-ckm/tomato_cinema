import { ApiProperty } from '@nestjs/swagger'
import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsNumberString,
	IsString,
	Length,
	Validate
} from 'class-validator'
import { IdentifierValidator } from '../../../../shared/validators'

export class VerifyOtpRequest {
	@ApiProperty({
		example: '0868261400'
	})
	@IsString()
	@Validate(IdentifierValidator)
	public identifier: string

	@ApiProperty({
		example: '123456'
	})
	@IsNotEmpty()
	@IsNumberString()
	@Length(6)
	public code: string

	@ApiProperty({
		example: 'phone',
		enum: ['email', 'phone']
	})
	@IsEnum(['email', 'phone'])
	public type: 'email' | 'phone'
}
