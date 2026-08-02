import { ConfigService } from '@nestjs/config'
import { PassportOptions } from '@tomatocinema/passport'
import type { AllConfig } from 'config/interfaces'

export function getPassportConfig(
	configService: ConfigService<AllConfig>
): PassportOptions {
	return {
		secretKey: configService.get('passport.secretKey', {
			infer: true
		})
	}
}
