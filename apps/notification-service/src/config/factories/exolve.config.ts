import { ConfigService } from '@nestjs/config'
import { SmsOptions } from 'src/infrastucture/sms/interfaces'

export function getExolveConfig(configService: ConfigService): SmsOptions {
	return {
		apiKey: configService.get('exolve.apiKey') ?? '',
		sender: configService.get('exolve.sender') ?? ''
	}
}
