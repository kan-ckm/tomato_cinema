import { Injectable, UnauthorizedException } from '@nestjs/common'
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
import { TelegramRepository } from './telegram.repository'

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
		private readonly userRespoSitory: UserRepository
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
	// Hàm tạo đường link đăng nhập Telegram để trả về cho Frontend
	public getAuthUrl() {
		const url = new URL('https://oauth.telegram.org/auth')

		url.searchParams.append('bot_id', this.BOT_ID)
		url.searchParams.append('origin', this.REDIRECT_ORIGIN)
		url.searchParams.append('request_access', 'write')
		url.searchParams.append('return_to', this.REDIRECT_ORIGIN)
		return { url: url.href }
	}
	// Hàm xử lý dữ liệu sau khi người dùng xác nhận đăng nhập trên Telegram
	public async verify(data: TelegramVerifyRequest) {
		const isValid = this.checkTelegramAuth(data.query)

		if (!isValid)
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: 'Chữ ký telegram không hợp lệ'
			})

		const telegramId = data.query.id
		const exists =
			await this.telegramRepository.findByTelegramId(telegramId)

		if (exists && exists.phone) {
			return this.tokenService.generate(exists.id)
		}

		const sessionId = randomBytes(16).toString('hex')

		await this.redisService.set(
			`telegram_session:${sessionId}`,
			JSON.stringify({ telegramId, username: data.query.username }),
			'EX',
			300
		)

		// Trả về link chuyển hướng user mở app Telegram để chat với Bot (kèm theo mã session)
		// Bot sẽ lấy mã này, chọc vào Redis lấy thông tin và yêu cầu user chia sẻ số điện thoại
		return { url: `https://t.me/${this.BOT_USERNAME}?start=${sessionId}` }
	}

	// hàm hoàn tất đăng nhập được gọi bởi con Bot (bot-service) khi user bấm nút "Chia sẻ số điện thoại"
	public async complete(data: TelegramCompleteRequest) {
		const { sessionId, phone } = data
		const raw = await this.redisService.get(`telegram_session:${sessionId}`)

		if (!raw)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Phiên truy cập không tồn tại'
			})

		const { telegramId } = JSON.parse(raw)

		let user = await this.userRespoSitory.findByPhone(phone)

		if (!user) user = await this.userRespoSitory.create({ phone })

		await this.userRespoSitory.update(user.id, {
			telegramId,
			isPhoneVerified: true
		})

		const tokens = this.tokenService.generate(user.id)

		await this.redisService.set(
			`telegram_tokens:${sessionId}`,
			JSON.stringify(tokens),
			'EX',
			120
		)

		await this.redisService.del(`telegram_session:${sessionId}`)

		return { sessionId }
	}

	// Lấy Token thật trả về cho Frontend khi Frontend báo "Tao đã đưa SĐT cho Bot rồi"
	public async consumeSession(data: TelegramConsumeRequest) {
		const { sessionId } = data

		const raw = await this.redisService.get(`telegram_tokens:${sessionId}`)

		if (!raw)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Phiên không tồn tại'
			})

		const tokens = JSON.parse(raw)

		await this.redisService.del(`telegram_tokens:${sessionId}`)

		return tokens
	}

	// Hàm thuật toán mã hóa độc quyền của Telegram để kiểm tra tính toàn vẹn của dữ liệu
	private checkTelegramAuth(query: Record<string, string>) {
		const hash = query.hash

		if (!hash) return false

		const dataCheckArr = Object.keys(query)
			.filter(k => k !== 'hash')
			.sort()
			.map(k => `${k}=${query[k]}`)

		const dataCheckString = dataCheckArr.join('\n')

		const secretKey = createHash('sha256')
			.update(`${this.BOT_ID}:${this.BOT_TOKEN}`)
			.digest()

		const hmac = createHmac('sha256', secretKey)
			.update(dataCheckString)
			.digest('hex')

		const isValid = hmac === hash

		return isValid
	}
}
