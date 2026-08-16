import { IsUrl } from 'class-validator'

export class RmqValidator {
	/**
	 * - protocols: Chỉ chấp nhận giao thức amqp (RabbitMQ)
	 * - require_tld: false -> Cho phép domain không có TLD (như 'localhost' hoặc IP trong môi trường dev/docker)
	 * - require_protocol: true -> Bắt buộc URL phải có tiền tố protocol ('amqp://')
	 */
	@IsUrl({
		protocols: ['amqp'],
		require_tld: false,
		require_protocol: true
	})
	public RMQ_URL: string
}
