import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength
} from 'class-validator'

/**
 * DTO tiếp nhận dữ liệu đăng ký tài khoản mới qua Email và Mật khẩu
 */
export class RegisterRequest {
	@ApiProperty({
		example: 'user@tomatocinema.com',
		description: 'Địa chỉ email người dùng'
	})
	@IsNotEmpty({ message: 'Email không được để trống' })
	@IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
	@Transform(({ value }: { value?: string }) => value?.trim().toLowerCase())
	public email: string

	@ApiProperty({
		example: 'P@ssword123',
		description: 'Mật khẩu tài khoản (ít nhất 6 ký tự)',
		minLength: 6,
		maxLength: 50
	})
	@IsNotEmpty({ message: 'Mật khẩu không được để trống' })
	@IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
	@MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
	@MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
	public password: string
}
