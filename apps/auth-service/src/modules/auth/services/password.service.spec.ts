import { PasswordService } from './hash-password.service'

describe('PasswordService', () => {
	let passwordService: PasswordService

	beforeEach(() => {
		passwordService = new PasswordService()
	})

	it('nên băm mật khẩu thành công bằng thuật toán Argon2id', async () => {
		const rawPassword = 'MySecurePassword123!'
		const hash = await passwordService.hash(rawPassword)

		expect(hash).toBeDefined()
		expect(typeof hash).toBe('string')
		expect(hash.startsWith('$argon2id$')).toBe(true)
	})

	it('nên trả về true khi kiểm tra đúng mật khẩu', async () => {
		const rawPassword = 'CorrectPassword@2026'
		const hash = await passwordService.hash(rawPassword)

		const isMatch = await passwordService.compare(rawPassword, hash)
		expect(isMatch).toBe(true)
	})

	it('nên trả về false khi kiểm tra sai mật khẩu', async () => {
		const rawPassword = 'CorrectPassword@2026'
		const hash = await passwordService.hash(rawPassword)

		const isMatch = await passwordService.compare('WrongPassword', hash)
		expect(isMatch).toBe(false)
	})

	it('nên trả về false an toàn nếu chuỗi hash không hợp lệ', async () => {
		const isMatch = await passwordService.compare(
			'password',
			'invalid-hash-string'
		)
		expect(isMatch).toBe(false)
	})
})
