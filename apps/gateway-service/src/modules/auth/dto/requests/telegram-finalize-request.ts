import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class TelegramFinalizeRequest {
	@ApiProperty({
		example: '0f8d87a69747f2270b60ad3f9677662f'
	})
	@IsNotEmpty()
	@IsString()
	public sessionId: string
}
