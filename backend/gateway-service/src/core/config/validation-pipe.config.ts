import { ValidationPipeOptions } from '@nestjs/common'

// tách riêng thành hàm getValidationPipeConfig ra giúp dễ quản lý hơn và file main.ts sẽ trông gọn hơn
export function getValidationPipeConfig(): ValidationPipeOptions {
	return {
		transform: true,
		whitelist: true
	}
}
