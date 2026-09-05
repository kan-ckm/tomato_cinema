import { ApiProperty } from '@nestjs/swagger'

export class AuthResponse {
	@ApiProperty({
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
		description:
			'JWT Access Token dùng cho Authorization Header (Bearer <token>)'
	})
	public accessToken: string
}
