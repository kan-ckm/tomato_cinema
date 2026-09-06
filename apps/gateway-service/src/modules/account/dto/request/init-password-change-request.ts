import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class InitPasswordChangeRequest {
	@ApiProperty({
		example: 'OldPassword123!',
		description: 'Mật khẩu hiện tại của tài khoản'
	})
	@IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
	@IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
	public currentPassword: string
}
