import { HttpService } from '@nestjs/axios'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { firstValueFrom, throwError } from 'rxjs'
import { catchError, delay, retryWhen, scan, timeout } from 'rxjs/operators'
import { SMS_OPTIONS } from './constants'
import type { SendSmsRequest, SendSmsResponse, SmsOptions } from './interfaces'

@Injectable()
export class SmsService {
	private readonly logger = new Logger(SmsService.name)
	private readonly BASE_URL: string

	public constructor(
		private readonly httpService: HttpService,
		@Inject(SMS_OPTIONS) private readonly options: SmsOptions
	) {
		this.BASE_URL = 'https://api.exolve.ru'
	}

	public sendOtp(phone: string, code: string) {
		return this.send({
			destination: phone,
			text: `Mã xác nhận của bạn: ${code}`
		})
	}

	public sendPhoneChanged(phone: string, code: string) {
		return this.send({
			destination: phone,
			text: `Mã xác nhận thay đổi số điện thoại của bạn: ${code}`
		})
	}

	public async send(data: SendSmsRequest): Promise<SendSmsResponse> {
		const payload = {
			number: data.sender ?? this.options.sender,
			destination: data.destination.replace('+', ''),
			text: data.text
		}
		return this.request<SendSmsResponse>(
			'POST',
			'messaging/v1/SendSMS',
			payload
		)
	}

	private async request<T>(method: 'GET' | 'POST', path: string, body?: any) {
		const url = `${this.BASE_URL}${path}`

		try {
			const request = this.httpService
				.request<T>({
					method,
					url,
					data: body,
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.options.apiKey}`
					}
				})
				.pipe(
					timeout(70000),
					retryWhen(error =>
						error.pipe(
							scan((retryCount, error) => {
								if (retryCount >= 3) {
									throw error
								}

								this.logger.warn(
									`Retry request ${method} ${path}: ${retryCount + 1}/3`
								)
								return retryCount + 1
							}, 0),
							delay(500)
						)
					),
					catchError(error => {
						const details =
							error.response.data ?? error.message ?? error

						this.logger.error(
							`Exolve sms api error (${method} ${path})\n${JSON.stringify(details)}`
						)

						return throwError(() => error)
					})
				)
			const response = await firstValueFrom(request)

			return response.data
		} catch (error) {
			this.logger.error(
				`Request failed: (${method} ${path}) :${error.message}`
			)
			throw error
		}
	}
}
