import { ConfigService } from '@nestjs/config'
import { PassportOptions } from '@tomatocinema/passport'
import type { AllConfigs } from 'config/interfaces'

export function getPassportConfig(
	configService: ConfigService<AllConfigs>
): PassportOptions {
	return {
		secretKey: configService.get('passport.secretKey', {
			infer: true
		})
	}
}
