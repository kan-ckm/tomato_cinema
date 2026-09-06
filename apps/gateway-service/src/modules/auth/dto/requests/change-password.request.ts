import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class ChangePasswordRequest {
	@ApiProperty({
		example: 'CurrentPassword123!',
		description: 'Mật khẩu hiện tại'
	})
	@IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
	@IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
	public currentPassword: string

	@ApiProperty({
		example: 'NewPassword123!',
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
