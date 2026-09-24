import { Controller, UseInterceptors } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import type {
	otpRequestedEvent,
	PasswordChangedEvent,
	PasswordResetRequestedEvent
} from '@tomatocinema/contracts'
import { RmqMetricsAckInterceptor } from '../interceptors/rmq-metrics-ack.interceptor'
import { AuthNotificationsService } from '../services/auth-notifications.service'

@Controller()
@UseInterceptors(RmqMetricsAckInterceptor)
export class AuthNotificationsController {
	public constructor(
		private readonly authNotificationsService: AuthNotificationsService
	) {}

	@EventPattern('auth.password_reset.requested')
	public async passwordResetRequested(
		@Payload() data: PasswordResetRequestedEvent
	): Promise<void> {
		await this.authNotificationsService.sendPasswordReset(data)
	}

	@EventPattern('auth.password.changed')
	public async passwordChanged(
		@Payload() data: PasswordChangedEvent
	): Promise<void> {
		await this.authNotificationsService.sendPasswordChanged(data)
	}

	/**
	 * @deprecated Giữ lại tương thích nếu có sự kiện cũ
	 */
	@EventPattern('auth.otp.requested')
	public async otpRequested(
		@Payload() data: otpRequestedEvent
	): Promise<void> {
		await this.authNotificationsService.sendOtp(data)
	}
}
