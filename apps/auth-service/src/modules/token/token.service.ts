import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import { PassportService, TokenPayload } from '@tomatocinema/passport'
import { createHash } from 'node:crypto'
import { AllConfigs } from '@/config'
import { RedisService } from '@/infrastructure/redis/redis.service'

/**
 * Prefix cho key Redis lưu trữ phiên Refresh Token đang hoạt động.
 * Key format: rt:{userId}:{fingerprint}
 */
const REDIS_RT_PREFIX = 'rt'

/**
 * Prefix cho key Redis lưu phiên trong cửa sổ ân hạn (Grace Period) để xử lý Race Condition khi đa tab.
 * Key format: rt_grace:{userId}:{fingerprint}
 */
const REDIS_RT_GRACE_PREFIX = 'rt_grace'

/**
 * Prefix cho key Redis đánh dấu token đã từng xoay vòng để phát hiện tấn công tái sử dụng (Reuse Detection).
 * Key format: rt_revoked:{userId}:{fingerprint}
 */
const REDIS_RT_REVOKED_PREFIX = 'rt_revoked'

/**
 * Thời gian ân hạn cho Refresh Token vừa xoay vòng (30 giây).
 * Cho phép các request đồng thời từ các tab khác nhau nhận cùng một cặp token mới.
 */
const GRACE_PERIOD_TTL = 30

/**
 * Thời gian lưu vết token đã xoay vòng để phát hiện Replay Attack (24 giờ).
 */
const REVOKED_TRACKING_TTL = 24 * 60 * 60

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
	 * Xoay vòng Refresh Token (Refresh Token Rotation):
	 * - Khắc phục Race Condition (đa tab/đa request đồng thời) bằng cơ chế Grace Period 30s.
	 * - Phát hiện và phòng thủ tấn công đánh cắp token (Token Reuse / Replay Detection) theo OAuth 2.0 Security BCP.
	 *   Nếu phát hiện token cũ đã xoay vòng được tái sử dụng ngoài cửa sổ ân hạn -> Thu hồi TOÀN BỘ phiên của user.
	 */
	public async rotate(
		refreshToken: string
	): Promise<{ accessToken: string; refreshToken: string }> {
		const result = this.passportService.verify(refreshToken, 'refresh')
		if (!result.valid) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: result.reason
			})
		}

		const { userId } = result
		const fingerprint = this.computeFingerprint(refreshToken)

		// 1. Kiểm tra Cửa sổ Ân hạn (Grace Period):
		// Nếu request đến từ một tab khác vừa thực hiện refresh cách đây chưa tới 30 giây,
		// trả về ngay cặp token mới nhất đã được lưu trong Redis cache để tránh forced logout.
		const graceKey = `${REDIS_RT_GRACE_PREFIX}:${userId}:${fingerprint}`
		const graceSession = await this.redisService.get(graceKey)
		if (graceSession) {
			try {
				const cachedTokens = JSON.parse(graceSession) as {
					accessToken: string
					refreshToken: string
				}
				return cachedTokens
			} catch {
				// Nếu parse lỗi thì tiếp tục luồng bên dưới
			}
		}

		// 2. Phát hiện Tái sử dụng Token (Token Reuse Detection - Replay Attack):
		// Nếu token không còn trong Grace Period nhưng nằm trong danh sách đã thu hồi/xoay vòng trước đó
		// -> Dấu hiệu kẻ tấn công đang sử dụng token đánh cắp được.
		const revokedKey = `${REDIS_RT_REVOKED_PREFIX}:${userId}:${fingerprint}`
		const isReused = await this.redisService.get(revokedKey)
		if (isReused) {
			// Thu hồi ngay lập tức TOÀN BỘ các phiên của tài khoản này
			await this.revokeAllRefreshTokens(userId)
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details:
					'Phát hiện tái sử dụng token bất thường. Toàn bộ phiên đăng nhập đã bị thu hồi để bảo vệ tài khoản.'
			})
		}

		// 3. Kiểm tra tính hợp lệ của phiên hiện tại trong Redis
		const redisKey = `${REDIS_RT_PREFIX}:${userId}:${fingerprint}`
		const session = await this.redisService.get(redisKey)
		if (!session) {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Phiên đã hết hạn hoặc đã bị thu hồi'
			})
		}

		// 4. Sinh cặp Token mới
		const newTokens = await this.generate(userId)

		// 5. Cập nhật Redis nguyên tử (Pipeline):
		// - Xóa phiên cũ khỏi danh sách active
		// - Lưu phiên cũ vào Grace Period (30s) chứa cặp token mới
		// - Lưu phiên cũ vào Revoked Tracking (24h) để phát hiện replay attack nếu bị dùng lại sau grace period
		const pipeline = this.redisService.pipeline()
		pipeline.del(redisKey)
		pipeline.set(
			graceKey,
			JSON.stringify(newTokens),
			'EX',
			GRACE_PERIOD_TTL
		)
		pipeline.set(revokedKey, '1', 'EX', REVOKED_TRACKING_TTL)
		await pipeline.exec()

		return newTokens
	}

	/**
	 * Thu hồi một Refresh Token cụ thể (khi đăng xuất).
	 */
	public async revokeRefreshToken(
		userId: string,
		fingerprint: string
	): Promise<void> {
		const pipeline = this.redisService.pipeline()
		pipeline.del(`${REDIS_RT_PREFIX}:${userId}:${fingerprint}`)
		pipeline.del(`${REDIS_RT_GRACE_PREFIX}:${userId}:${fingerprint}`)
		pipeline.del(`${REDIS_RT_REVOKED_PREFIX}:${userId}:${fingerprint}`)
		await pipeline.exec()
	}

	/**
	 * Thu hồi TẤT CẢ Refresh Token của một người dùng (khi đổi mật khẩu, bị khóa tài khoản, hoặc phát hiện xâm nhập).
	 * Sử dụng SCAN để xóa tất cả key matching pattern rt*:{userId}:* một cách an toàn.
	 */
	public async revokeAllRefreshTokens(userId: string): Promise<void> {
		const patterns = [
			`${REDIS_RT_PREFIX}:${userId}:*`,
			`${REDIS_RT_GRACE_PREFIX}:${userId}:*`,
			`${REDIS_RT_REVOKED_PREFIX}:${userId}:*`
		]

		for (const pattern of patterns) {
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
	}

	/**
	 * Tính fingerprint (dấu vân tay) của token bằng SHA-256.
	 * Dùng làm khóa Redis để nhận diện từng Refresh Token cụ thể.
	 */
	private computeFingerprint(token: string): string {
		return createHash('sha256').update(token).digest('hex').slice(0, 32)
	}
}
