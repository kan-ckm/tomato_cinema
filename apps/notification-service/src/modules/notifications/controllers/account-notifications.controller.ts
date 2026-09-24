import { Controller, UseInterceptors } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import type {
	EmailChangedEvent,
	PhoneChangedEvent
} from '@tomatocinema/contracts'
import { RmqMetricsAckInterceptor } from '../interceptors/rmq-metrics-ack.interceptor'
import { AccountNotificationsService } from '../services/account-notifications.service'

@Controller()
@UseInterceptors(RmqMetricsAckInterceptor)
export class AccountNotificationsController {
	public constructor(
		private readonly accountNotificationsService: AccountNotificationsService
	) {}

	@EventPattern('account.email.changed')
	public async emailChanged(
		@Payload() data: EmailChangedEvent
	): Promise<void> {
		await this.accountNotificationsService.sendEmailChange(data)
	}

	@EventPattern('account.phone.changed')
	public async phoneChanged(
		@Payload() data: PhoneChangedEvent
	): Promise<void> {
		await this.accountNotificationsService.sendPhoneChange(data)
	}
}
