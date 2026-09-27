import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportService, TokenPayload } from '@tomatocinema/passport'
import { createHash } from 'node:crypto'
import { AllConfigs } from '@/config'
import { RedisService } from '@/infrastructure/redis/redis.service'

/**
 * Prefix cho key Redis lưu trữ phiên Refresh Token.
 * Key format: rt:{userId}:{fingerprint}
 */
const REDIS_RT_PREFIX = 'rt'

export type VerifyRefreshTokenResult =
	| {
			valid: true
			userId: string
			fingerprint: string
			reason?: never
	  }
	| {
			valid: false
			reason: string
			userId?: never
			fingerprint?: never
	  }

@Injectable()
export class TokenService {
	private readonly ACCESS_TOKEN_TTL: number
	private readonly REFRESH_TOKEN_TTL: number

	public constructor(
		private readonly configService: ConfigService<AllConfigs>,
		private readonly passportService: PassportService,
		private readonly redisService: RedisService
	) {
		this.ACCESS_TOKEN_TTL = this.configService.get('passport.accessTtl', {
			infer: true
		})
		this.REFRESH_TOKEN_TTL = this.configService.get('passport.refreshTtl', {
			infer: true
		})
	}

	/**
	 * Tạo cặp Access Token và Refresh Token.
	 * Access Token: stateless, chỉ dùng chữ ký HMAC.
	 * Refresh Token: stateful, lưu phiên vào Redis để hỗ trợ thu hồi (revocation) và xoay vòng (rotation).
	 */
	public async generate(userId: string) {
		const payload: TokenPayload = { sub: userId }

		const accessToken = this.passportService.generate(
			String(payload.sub),
			this.ACCESS_TOKEN_TTL,
			'access'
		)
		const refreshToken = this.passportService.generate(
			String(payload.sub),
			this.REFRESH_TOKEN_TTL,
			'refresh'
		)

		// Lưu phiên Refresh Token vào Redis với TTL tương ứng
		const fingerprint = this.computeFingerprint(refreshToken)
		await this.redisService.set(
			`${REDIS_RT_PREFIX}:${userId}:${fingerprint}`,
			JSON.stringify({ userId, createdAt: Date.now() }),
			'EX',
			this.REFRESH_TOKEN_TTL
		)

		return { accessToken, refreshToken }
	}

	/**
	 * Xác thực Access Token (stateless - chỉ kiểm tra chữ ký HMAC và hạn sử dụng).
	 */
	public verifyAccessToken(token: string) {
		return this.passportService.verify(token, 'access')
	}

	/**
	 * Xác thực Refresh Token (stateful - kiểm tra chữ ký HMAC, hạn sử dụng VÀ kiểm tra phiên trong Redis).
	 * Nếu hợp lệ, trả về userId và fingerprint để phục vụ Refresh Token Rotation.
	 */
	public async verifyRefreshToken(
		token: string
	): Promise<VerifyRefreshTokenResult> {
		const result = this.passportService.verify(token, 'refresh')

		if (!result.valid) {
			return {
				valid: false,
				reason: result.reason
			}
		}

		// Kiểm tra phiên tồn tại trong Redis (token chưa bị thu hồi)
		const fingerprint = this.computeFingerprint(token)
		const redisKey = `${REDIS_RT_PREFIX}:${result.userId}:${fingerprint}`
		const session = await this.redisService.get(redisKey)

		if (!session) {
			return {
				valid: false,
				reason: 'Phiên đã hết hạn hoặc đã bị thu hồi'
			}
		}

		return {
			valid: true,
			userId: result.userId,
			fingerprint
		}
	}

	/**
	 * Thu hồi một Refresh Token cụ thể (khi đăng xuất hoặc xoay vòng token).
	 */
	public async revokeRefreshToken(
		userId: string,
		fingerprint: string
	): Promise<void> {
		await this.redisService.del(
			`${REDIS_RT_PREFIX}:${userId}:${fingerprint}`
		)
	}

	/**
	 * Thu hồi TẤT CẢ Refresh Token của một người dùng (khi đổi mật khẩu, bị khóa tài khoản,...).
	 * Sử dụng SCAN để xóa tất cả key matching pattern rt:{userId}:* một cách an toàn.
	 */
	public async revokeAllRefreshTokens(userId: string): Promise<void> {
		const pattern = `${REDIS_RT_PREFIX}:${userId}:*`
		let cursor = '0'

		do {
			const [nextCursor, keys] = await this.redisService.scan(
				cursor,
				'MATCH',
				pattern,
				'COUNT',
				100
			)
			cursor = nextCursor

			if (keys.length > 0) {
				await this.redisService.del(...keys)
			}
		} while (cursor !== '0')
	}

	/**
	 * Tính fingerprint (dấu vân tay) của token bằng SHA-256.
	 * Dùng làm khóa Redis để nhận diện từng Refresh Token cụ thể.
	 */
	private computeFingerprint(token: string): string {
		return createHash('sha256').update(token).digest('hex').slice(0, 32)
	}
}
