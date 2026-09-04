import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class TelegramVerifyRequest {
	@ApiProperty({
		example:
			'eyJpZCI6NTU4NTcyMzE4MCwiZmlyc3RfbmFtZSI6IlQiLCJsYXN0X25hbWUiOiJBIiwiYXV0aF9kYXRlIjoxNzg2MjU3MzAwLCJoYXNoIjoiZjJjMGFmYzRlNDM5MWJhNWFkNTcxNWRjMDc2YzExOGIwYjBiY2FmMDk5NTgzNjZiNTU5YzhhNjNmM2Q3M2FmZCJ9'
	})
	@IsNotEmpty()
	@IsString()
	public tgAuthResult: string
}
