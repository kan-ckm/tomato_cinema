import {
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface
} from 'class-validator'

// kiểm tra dữ liệu và ngăn chặn mã độc
@ValidatorConstraint({
	name: 'IdentifierValidator',
	async: false
})
export class IdentifierValidator implements ValidatorConstraintInterface {
	public validate(value: string, args?: ValidationArguments): boolean {
		const object = args?.object as { type?: string } | undefined

		if (object?.type === 'email') {
			return (
				typeof value === 'string' &&
				/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
			)
		} else if (object?.type === 'phone') {
			return (
				typeof value === 'string' &&
				/^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/.test(value)
			)
		}

		return false
	}

	public defaultMessage(args?: ValidationArguments): string {
		const object = args?.object as { type?: string } | undefined
		if (object?.type === 'email') return 'identifier must be a valid email'
		if (object?.type === 'phone') return 'identifier must be a valid phone'
		return 'invalid identifier'
	}
}
