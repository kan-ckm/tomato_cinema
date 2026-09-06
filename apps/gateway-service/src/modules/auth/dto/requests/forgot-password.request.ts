import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class ForgotPasswordRequest {
	@ApiProperty({
		example: 'user@tomatocinema.com',
		description: 'Địa chỉ email tài khoản cần đặt lại mật khẩu'
	})
	@IsNotEmpty({ message: 'Email không được để trống' })
	@IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
	@Transform(({ value }: { value?: string }) => value?.trim().toLowerCase())
	public email: string
}
