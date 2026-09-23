import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

/**
 * DTO tiếp nhận dữ liệu xác thực email bằng mã OTP
 */
export class VerifyEmailRequest {
	@ApiProperty({
		example: 'user@tomatocinema.com',
		description: 'Địa chỉ email cần xác thực'
	})
	@IsNotEmpty({ message: 'Email không được để trống' })
	@IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
	@Transform(({ value }: { value?: string }) => value?.trim().toLowerCase())
	public email: string

	@ApiProperty({
		example: '123456',
		description: 'Mã xác thực OTP gồm 6 chữ số được gửi qua email',
		minLength: 6,
		maxLength: 6
	})
	@IsNotEmpty({ message: 'Mã xác thực OTP không được để trống' })
	@IsString({ message: 'Mã xác thực phải là chuỗi ký tự' })
	@Length(6, 6, { message: 'Mã xác thực OTP phải gồm đúng 6 ký tự' })
	public code: string
}
