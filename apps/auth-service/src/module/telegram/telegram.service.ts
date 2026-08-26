import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import {
	TelegramCompleteRequest,
	TelegramConsumeRequest,
	TelegramVerifyRequest
} from '@tomatocinema/contracts/gen/auth'
import { createHash, createHmac, randomBytes } from 'crypto'
import { AllConfigs } from '@/config'
import { RedisService } from '@/infrastucture/redis/redis.service'
import { UserRepository } from '@/shared/repository'
import { TokenService } from '../token/token.service'
import { UsersClientGrpc } from '../users/users.grpc'
import { TelegramRepository } from './telegram.repository'

/**
 * Service xử lý toàn bộ luồng đăng nhập qua Telegram OAuth / Telegram Bot
 */
@Injectable()
export class TelegramService {
	private readonly BOT_ID: string
	private readonly BOT_TOKEN: string
	private readonly BOT_USERNAME: string
	private readonly REDIRECT_ORIGIN: string

	public constructor(
		private readonly redisService: RedisService,
		private readonly configService: ConfigService<AllConfigs>,
		private readonly telegramRepository: TelegramRepository,
		private readonly tokenService: TokenService,
		private readonly userRespoSitory: UserRepository,
		private readonly usersClient: UsersClientGrpc
	) {
		this.BOT_ID = this.configService.get('telegram.botId', { infer: true })
		this.BOT_TOKEN = this.configService.get('telegram.botToken', {
			infer: true
		})
		this.BOT_USERNAME = this.configService.get('telegram.botUsername', {
			infer: true
		})
		this.REDIRECT_ORIGIN = this.configService.get(
			'telegram.redirectOrigin',
			{ infer: true }
		)
	}

	/**
	 * 1. Tạo đường link đăng nhập Telegram OAuth Widget để trả về cho Frontend
	 */
	public getAuthUrl() {
		const url = new URL('https://oauth.telegram.org/auth')

		url.searchParams.append('bot_id', this.BOT_ID)
		url.searchParams.append('origin', this.REDIRECT_ORIGIN)
		url.searchParams.append('request_access', 'write')
		url.searchParams.append('return_to', this.REDIRECT_ORIGIN)
		return { url: url.href }
	}

	/**
	 * 2. Xác minh dữ liệu sau khi người dùng bấm xác nhận trên Telegram Widget:
	 * - Kiểm tra chữ ký HMAC-SHA256
	 * - Nếu user cũ (đã liên kết SĐT): Cấp token đăng nhập ngay
	 * - Nếu user mới (chưa có SĐT): Sinh sessionId và trả link mở Bot Telegram để chia sẻ SĐT
	 */
	public async verify(data: TelegramVerifyRequest) {
		// 2.1 Kiểm tra chữ ký tính toàn vẹn
		const isValid = this.checkTelegramAuth(data.query)

		if (!isValid)
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Chữ ký telegram không hợp lệ'
			})

		const telegramId = data.query.id
		const exists =
			await this.telegramRepository.findByTelegramId(telegramId)

		// 2.2 Nếu tài khoản đã có và đã có số điện thoại -> Cấp token ngay
		if (exists && exists.phone) {
			return this.tokenService.generate(exists.id)
		}

		// 2.3 Chưa có số điện thoại -> Tạo session tạm lưu vào Redis trong 5 phút
		const sessionId = randomBytes(16).toString('hex')

		await this.redisService.set(
			`telegram_session:${sessionId}`,
			JSON.stringify({ telegramId, username: data.query.username }),
			'EX',
			300
		)

		// 2.4 Trả về link chuyển hướng user mở app Telegram chat với Bot kèm theo sessionId
		return { url: `https://t.me/${this.BOT_USERNAME}?start=${sessionId}` }
	}

	/**
	 * 3. Hoàn tất đăng nhập khi user bấm nút "Chia sẻ số điện thoại" trên Telegram Bot:
	 * - Bot gửi sessionId + số điện thoại lên
	 * - Tìm hoặc tạo mới tài khoản
	 * - Đồng bộ sang user-service nếu là tài khoản mới
	 * - Lưu token tạm thời vào Redis cho Frontend lấy
	 */
	public async complete(data: TelegramCompleteRequest) {
		const { sessionId, phone } = data
		const raw = await this.redisService.get(`telegram_session:${sessionId}`)

		if (!raw)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Phiên truy cập không tồn tại'
			})

		const { telegramId } = JSON.parse(raw)

		// 3.1 Tìm theo số điện thoại, nếu chưa có thì tạo mới
		let isNew = false
		let user = await this.userRespoSitory.findByPhone(phone)

		if (!user) {
			user = await this.userRespoSitory.create({ phone })
			isNew = true
		}

		// 3.2 Cập nhật telegramId và đánh dấu sđt đã xác minh
		await this.userRespoSitory.update(user.id, {
			telegramId,
			isPhoneVerified: true
		})

		// 3.3 Đồng bộ sang user-service tạo profile (chỉ khi là tài khoản mới)
		if (isNew) {
			await this.usersClient.create({ id: user.id })
		}

		// 3.4 Tạo cặp token và cất vào Redis trong 2 phút chờ Frontend lấy
		const tokens = this.tokenService.generate(user.id)

		await this.redisService.set(
			`telegram_tokens:${sessionId}`,
			JSON.stringify(tokens),
			'EX',
			120
		)

		// 3.5 Xóa session tạm
		await this.redisService.del(`telegram_session:${sessionId}`)

		return { sessionId }
	}

	/**
	 * 4. Lấy Token thật trả về cho Frontend sau khi user đã chia sẻ SĐT với Bot
	 */
	public async consumeSession(data: TelegramConsumeRequest) {
		const { sessionId } = data

		const raw = await this.redisService.get(`telegram_tokens:${sessionId}`)

		if (!raw)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Phiên không tồn tại hoặc đã hết hạn'
			})

		const tokens = JSON.parse(raw)

		// Sử dụng 1 lần: Xóa token khỏi Redis ngay sau khi lấy
		await this.redisService.del(`telegram_tokens:${sessionId}`)

		return tokens
	}

	/**
	 * 5. Thuật toán kiểm tra chữ ký Telegram bằng HMAC-SHA256
	 */
	private checkTelegramAuth(query: Record<string, string>) {
		const hash = query.hash

		if (!hash) return false

		// Sắp xếp các tham số theo bảng chữ cái và ghép thành chuỗi
		const dataCheckArr = Object.keys(query)
			.filter(k => k !== 'hash')
			.sort()
			.map(k => `${k}=${query[k]}`)

		const dataCheckString = dataCheckArr.join('\n')

		// Tạo secret key từ bot_token
		const secretKey = createHash('sha256')
			.update(`${this.BOT_ID}:${this.BOT_TOKEN}`)
			.digest()

		// Tính mã băm HMAC-SHA256 và so khớp với hash gửi lên
		const hmac = createHmac('sha256', secretKey)
			.update(dataCheckString)
			.digest('hex')

		const isValid = hmac === hash

		return isValid
	}
}
