import { IsOptional, IsString, IsUrl } from 'class-validator'

export class RmqValidator {
	@IsUrl({
		protocols: ['amqp'],
		require_tld: false,
		require_protocol: true
	})
	public RMQ_URL: string

	@IsOptional()
	@IsString()
	public RMQ_QUEUE?: string
}
