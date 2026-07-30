import { ApiProperty } from '@nestjs/swagger'

export class HealthResponse {
	@ApiProperty({
		description: 'The status of the health check',
		example: 'ok'
	})
	public status: string
	@ApiProperty({
		description: 'The timestamp of the health check',
		example: new Date().toISOString()
	})
	public timestamp: string
}
