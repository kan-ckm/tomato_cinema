import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

/**
 * DTO tiếp nhận dữ liệu đăng nhập bằng Email và Mật khẩu
 */
export class LoginRequest {
	@ApiProperty({
		example: 'user@tomatocinema.com',
		description: 'Địa chỉ email đã đăng ký'
	})
	@IsNotEmpty({ message: 'Email không được để trống' })
	@IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
	@Transform(({ value }: { value?: string }) => value?.trim().toLowerCase())
	public email: string

	@ApiProperty({
		example: 'P@ssword123',
		description: 'Mật khẩu của tài khoản'
	})
	@IsNotEmpty({ message: 'Mật khẩu không được để trống' })
	@IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
	public password: string
}
