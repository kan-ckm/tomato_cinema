import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService
	extends Redis
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(RedisService.name)
	public constructor(private readonly configService: ConfigService) {
		super({
			username: configService.getOrThrow<string>('REDIS_USER'),
			password: configService.getOrThrow<string>('REDIS_PASSWORD'),
			host: configService.getOrThrow<string>('REDIS_HOST'),
			port: configService.getOrThrow<number>('REDIS_PORT'),
			maxRetriesPerRequest: 5,
			enableOfflineQueue: true
		})
	}
	public async onModuleInit() {
		const start = Date.now()

		this.logger.log('Đang khởi tạo kết nối đến redis')

		this.on('connect', () => {
			this.logger.log('đang kết nối đến redis')
		})
		this.on('ready', () => {
			const ms = Date.now() - start
			this.logger.log(`Redis kết nối tốn (time=${ms}ms)`)
		})
		this.on('error', err => {
			this.logger.error('Redis error', {
				error: err.message ?? err
			})
		})
		this.on('close', () => {
			this.logger.warn('Redis đang tắt')
		})
		this.on('reconnecting', () => {
			this.logger.log('redis đang kết nối lại')
		})
	}
	public async onModuleDestroy() {
		this.logger.log('đang đóng kết nối redis')

		try {
			await this.quit()
			this.logger.log('redis đã đóng')
		} catch (error) {
			this.logger.error('lỗi khi đóng kết nối error', error)
		}
	}
}
