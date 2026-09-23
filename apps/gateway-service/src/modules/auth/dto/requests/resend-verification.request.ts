import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty } from 'class-validator'

/**
 * DTO yêu cầu gửi lại mã xác thực email
 */
export class ResendVerificationRequest {
	@ApiProperty({
		example: 'user@tomatocinema.com',
		description: 'Địa chỉ email cần nhận lại mã xác thực'
	})
	@IsNotEmpty({ message: 'Email không được để trống' })
	@IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
	@Transform(({ value }: { value?: string }) => value?.trim().toLowerCase())
	public email: string
}
