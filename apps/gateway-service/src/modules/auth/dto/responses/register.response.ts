import { ApiProperty } from '@nestjs/swagger'

export class RegisterResponse {
	@ApiProperty({ example: true, description: 'Trạng thái xử lý' })
	public ok: boolean

	@ApiProperty({
		example:
			'Mã xác thực đã được gửi tới email của bạn. Vui lòng xác thực để kích hoạt tài khoản.',
		description: 'Thông báo phản hồi'
	})
	public message: string

	@ApiProperty({
		example: 'user@tomatocinema.com',
		description: 'Email vừa đăng ký'
	})
	public email?: string
}
