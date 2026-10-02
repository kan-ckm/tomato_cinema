import { ConfigService } from '@nestjs/config'
import { RpcException } from '@nestjs/microservices'
import { PassportService } from '@tomatocinema/passport'
import { TokenService } from './token.service'

describe('TokenService', () => {
	let tokenService: TokenService
	let passportService: PassportService
	let redisStorage: Map<string, { value: string; ex?: number }>

	beforeEach(() => {
		redisStorage = new Map()

		passportService = new PassportService({
			secretKey: 'my-super-secret-key-for-testing-purposes-123456'
		})

		const mockConfigService = {
			get: (key: string) => {
				if (key === 'passport.accessTtl') return 3600
				if (key === 'passport.refreshTtl') return 2592000
				return null
			}
		}

		const mockRedisService = {
			get: jest.fn((key: string) => {
				return Promise.resolve(redisStorage.get(key)?.value ?? null)
			}),
			set: jest.fn(
				(key: string, value: string, _opt?: string, ex?: number) => {
					redisStorage.set(key, { value, ex })
					return Promise.resolve('OK')
				}
			),
			del: jest.fn((...keys: string[]) => {
				let count = 0
				for (const k of keys) {
					if (redisStorage.delete(k)) count++
				}
				return Promise.resolve(count)
			}),
			pipeline: jest.fn(() => {
				const operations: Array<() => void> = []
				const pipe = {
					del: (key: string) => {
						operations.push(() => {
							redisStorage.delete(key)
						})
						return pipe
					},
					set: (
						key: string,
						value: string,
						_opt?: string,
						ex?: number
					) => {
						operations.push(() => {
							redisStorage.set(key, { value, ex })
						})
						return pipe
					},
					exec: () => {
						for (const op of operations) op()
						return Promise.resolve([])
					}
				}
				return pipe
			}),
			scan: jest.fn(
				(_cursor: string, _match: string, pattern: string) => {
					const regex = new RegExp(
						'^' + pattern.replace(/\*/g, '.*') + '$'
					)
					const matched: string[] = []
					for (const key of redisStorage.keys()) {
						if (regex.test(key)) matched.push(key)
					}
					return Promise.resolve(['0', matched] as [string, string[]])
				}
			)
		}

		tokenService = new TokenService(
			mockConfigService as unknown as ConfigService<any>,
			passportService,
			mockRedisService as any
		)
	})

	describe('Token Generation', () => {
		it('should generate valid access and refresh tokens and save refresh token session in Redis', async () => {
			const userId = 'user-123-abc'
			const tokens = await tokenService.generate(userId)

			expect(tokens.accessToken).toBeDefined()
			expect(tokens.refreshToken).toBeDefined()

			// Access token should verify stateless
			const verifyAccess = tokenService.verifyAccessToken(
				tokens.accessToken
			)
			expect(verifyAccess.valid).toBe(true)
			expect(verifyAccess.userId).toBe(userId)

			// Refresh token should verify stateful
			const verifyRefresh = await tokenService.verifyRefreshToken(
				tokens.refreshToken
			)
			expect(verifyRefresh.valid).toBe(true)
			expect(verifyRefresh.userId).toBe(userId)
			expect(verifyRefresh.fingerprint).toBeDefined()
		})

		it('should reject refresh token used as access token (Domain Separation)', () => {
			const userId = 'user-123-abc'
			const refreshToken = passportService.generate(
				userId,
				3600,
				'refresh'
			)

			const verifyResult = tokenService.verifyAccessToken(refreshToken)
			expect(verifyResult.valid).toBe(false)
			expect(verifyResult.reason).toBe('loại token không hợp lệ')
		})
	})

	describe('Token Rotation & Grace Period (Race Condition Mitigation)', () => {
		it('should rotate active token, revoke old session and provide a grace period', async () => {
			const userId = 'user-123-abc'
			const initialTokens = await tokenService.generate(userId)

			// Rotate the token
			const rotatedTokens = await tokenService.rotate(
				initialTokens.refreshToken
			)

			expect(rotatedTokens.accessToken).toBeDefined()
			expect(rotatedTokens.refreshToken).toBeDefined()
			expect(rotatedTokens.refreshToken).not.toEqual(
				initialTokens.refreshToken
			)

			// Second concurrent request within Grace Period should receive SAME tokens without error
			const concurrentResult = await tokenService.rotate(
				initialTokens.refreshToken
			)
			expect(concurrentResult.accessToken).toBe(rotatedTokens.accessToken)
			expect(concurrentResult.refreshToken).toBe(
				rotatedTokens.refreshToken
			)
		})
	})

	describe('Token Reuse Detection (Anti-Replay / Token Theft Defense)', () => {
		it('should detect reuse of a token after grace period and revoke all sessions for that user', async () => {
			const userId = 'user-test-security'
			const initialTokens = await tokenService.generate(userId)

			// Step 1: Normal rotation
			const rotatedTokens = await tokenService.rotate(
				initialTokens.refreshToken
			)
			expect(rotatedTokens.refreshToken).toBeDefined()

			// Step 2: Simulate grace period expiration by removing the grace key
			for (const key of Array.from(redisStorage.keys())) {
				if (key.startsWith('rt_grace:')) {
					redisStorage.delete(key)
				}
			}

			// Step 3: Attacker tries to use the initial token (Reuse Attack)
			await expect(
				tokenService.rotate(initialTokens.refreshToken)
			).rejects.toThrow(RpcException)

			// Step 4: Verify that all user sessions have been globally revoked
			const remainingKeys = Array.from(redisStorage.keys()).filter(k =>
				k.includes(userId)
			)
			expect(remainingKeys).toHaveLength(0)
		})
	})

	describe('Revocation', () => {
		it('revokeAllRefreshTokens should scan and delete all sessions for the given user', async () => {
			const userId = 'user-revoke-all'
			await tokenService.generate(userId)
			await tokenService.generate(userId)
			await tokenService.generate('other-user')

			await tokenService.revokeAllRefreshTokens(userId)

			const userKeys = Array.from(redisStorage.keys()).filter(k =>
				k.includes(userId)
			)
			expect(userKeys).toHaveLength(0)

			const otherUserKeys = Array.from(redisStorage.keys()).filter(k =>
				k.includes('other-user')
			)
			expect(otherUserKeys.length).toBeGreaterThan(0)
		})
	})
})
