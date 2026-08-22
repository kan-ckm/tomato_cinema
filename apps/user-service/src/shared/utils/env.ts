import { ClassConstructor, plainToClass } from 'class-transformer'
import { validateSync } from 'class-validator'

export function validateEnv<T extends object>(
	config: Record<string, string | undefined>,
	envVariablesClass: ClassConstructor<T>
): T {
	//Ép kiểu object thô thành Class chuẩn
	const validateConfig = plainToClass(envVariablesClass, config, {
		enableImplicitConversion: true
	})

	//Validate tự động
	const errors = validateSync(validateConfig, {
		skipMissingProperties: false
	})

	//Xử lý khi có lỗi
	if (errors.length > 0) {
		const errorMsg = errors
			.map(
				error =>
					`\nError in ${error.property}:\n` +
					Object.entries(error.constraints || {})
						.map(
							// Phòng hờ constraints bị undefined
							([key, value]) => `+ ${key}: ${value}`
						)
						.join('\n')
			)
			.join('') // Chuyển Array thành String để quăng lỗi cho đẹp

		console.error(`\n${errors.toString()}`)
		throw new Error(errorMsg)
	}

	//TRẢ VỀ CẤU HÌNH
	return validateConfig
}
