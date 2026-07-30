import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'
import { ConfigService } from '@nestjs/config'

// tách riêng thành hàm getcorsconfig ra giúp dễ quản lý hơn và file main.ts sẽ trông gọn hơn
export function getCorsconfig(configService: ConfigService): CorsOptions {
	return {
		origin: configService.getOrThrow<string>('HTTP_CORS').split(','),
		credentials: true
	}
}
