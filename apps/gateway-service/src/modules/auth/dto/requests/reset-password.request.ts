import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Length,
	MaxLength,
	MinLength
} from 'class-validator'

export class ResetPasswordRequest {
	@ApiProperty({
		example: 'user@tomatocinema.com',
		description: 'Địa chỉ email tài khoản'
	})
	@IsNotEmpty({ message: 'Email không được để trống' })
	@IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
	@Transform(({ value }: { value?: string }) => value?.trim().toLowerCase())
	public email: string

	@ApiProperty({
		example: '123456',
		description: 'Mã xác thực gồm 6 chữ số gửi qua email'
	})
	@IsNotEmpty({ message: 'Mã xác thực không được để trống' })
	@IsString({ message: 'Mã xác thực phải là chuỗi ký tự' })
	@Length(6, 6, { message: 'Mã xác thực phải có đúng 6 ký tự' })
	public code: string

	@ApiProperty({
		example: 'NewSecurePassword123!',
		description: 'Mật khẩu mới (ít nhất 6 ký tự)',
		minLength: 6,
		maxLength: 50
	})
	@IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
	@IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
	@MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
	@MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
	public newPassword: string
}
