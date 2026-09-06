import { ApiProperty } from '@nestjs/swagger'
import {
	IsNotEmpty,
	IsNumberString,
	IsString,
	Length,
	Matches,
	MaxLength,
	MinLength
} from 'class-validator'

export class ConfirmPasswordChangeRequest {
	@ApiProperty({
		example: 'NewPassword123!',
		description:
			'Mật khẩu mới (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số)',
		minLength: 8,
		maxLength: 50
	})
	@IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
	@IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
	@MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
	@MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
		message:
			'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'
	})
	public newPassword: string

	@ApiProperty({
		example: '123456',
		description: 'Mã xác thực OTP gồm 6 chữ số'
	})
	@IsNotEmpty({ message: 'Mã xác nhận không được để trống' })
	@IsNumberString({}, { message: 'Mã xác nhận chỉ bao gồm số' })
	@Length(6, 6, { message: 'Mã xác nhận phải có đúng 6 chữ số' })
	public code: string
}
