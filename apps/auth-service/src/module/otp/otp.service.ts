import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@tomatocinema/common'
import { createHash } from 'crypto'
import { generateCode } from 'patcode'
import { RedisService } from '@/infrastucture/redis/redis.service'

// file này dùng nội bộ cho auth service
@Injectable()
export class OtpService {
	public constructor(private readonly redisService: RedisService) {}

	public async send(identifier: string, type: 'phone' | 'email') {
		const { code, hash } = this.generateCode()

		console.debug('CODE', code)
		// lưu mã vafo redis Cache
		await this.redisService.set(
			`otp:${type}:${identifier}`,
			hash,
			'EX',
			300
		)
		return { code, hash }
	}
	// xác thực mã otp
	public async verify(
		identifier: string,
		code: string,
		type: 'phone' | 'email'
	) {
		//tìm kiếm otp người dùng trong redis xem có ko
		// đoạn này nó sẽ lấy loại + email hoặc phone để tìm kiếm
		// data = otp:email:test@gmail.com
		const storedHash = await this.redisService.get(
			`otp:${type}:${identifier}`
		)
		if (!storedHash) {
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Mã không hợp lệ hoặc đã hết hạn'
			})
		}
		// tiếp theo mã hóa otp để so sánh với otp trong redis
		const incomingHash = createHash('sha256').update(code).digest('hex')

		if (storedHash !== incomingHash) {
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'mã không hợp lệ hoặc đã hết hạn'
			})
		}
		await this.redisService.del(`otp:${type}:${identifier}`)
	}

	// logic tạo ra mã otp
	private generateCode() {
		// tạo mã otp 6 chữ số
		const code = generateCode()
		// hash mã tăng bảo mật
		const hash = createHash('sha256').update(code).digest('hex')

		return { code, hash }
	}
}
