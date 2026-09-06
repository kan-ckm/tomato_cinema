import { ApiProperty } from '@nestjs/swagger'

export class SuccessResponse {
	@ApiProperty({ example: true, description: 'Trạng thái xử lý thành công' })
	public ok: boolean
}
