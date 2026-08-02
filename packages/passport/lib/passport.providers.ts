import { Provider } from '@nestjs/common'
import { PASSPORT_OPTIONS } from './constants'
import { PassportAsyncOptions, PassportOptions } from './interfaces'

export function createPassportOptionsProvider(
	options: PassportOptions
): Provider {
	return {
		provide: PASSPORT_OPTIONS,
		useValue: Object.freeze({ ...options })
	}
}

export function createPassportAsyncOptionProvider(
	options: PassportAsyncOptions
): Provider {
	return {
		provide: PASSPORT_OPTIONS,
		useFactory: async (...args: any[]) => {
			const resolved = await options.useFactory!(...args)
			if (!resolved || typeof resolved.secretKey !== 'string') {
				throw new Error(
					'[PassportModule] "SecretKey" bắt buộc phải là một chuỗi'
				)
			}
			return Object.freeze({ ...resolved })
		},
		inject: options.inject ?? []
	}
}
