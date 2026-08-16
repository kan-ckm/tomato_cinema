import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { otpRequestedEvent } from '@tomatocinema/contracts'

@Injectable()
export class MessagingService {
	public constructor(
		@Inject('NOTIFICATIONS_CLIENT') private readonly client: ClientProxy
	) {}
	public async otpRequested(data: otpRequestedEvent) {
		return this.client.emit('auth.otp.requested', data)
	}
}
