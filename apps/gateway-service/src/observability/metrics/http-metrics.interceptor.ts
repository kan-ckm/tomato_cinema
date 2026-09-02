import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor
} from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Request, Response } from 'express'
import { Counter, Gauge, Histogram } from 'prom-client'
import { finalize, Observable } from 'rxjs'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
	private readonly SERVICE_NAME: string

	public constructor(
		@InjectMetric('http_request_total')
		private readonly counter: Counter<string>,
		@InjectMetric('http_request_duration_seconds')
		private readonly histogram: Histogram<string>,
		@InjectMetric('http_request_in_flight')
		private readonly inFlight: Gauge<string>
	) {
		this.SERVICE_NAME = 'gateway-service'
	}
	public intercept(
		context: ExecutionContext,
		next: CallHandler<any>
	): Observable<any> {
		const req = context.switchToHttp().getRequest<Request>()
		const res = context.switchToHttp().getResponse<Response>()

		const method = req.method
		const route = req.route.path || 'unknow'

		this.inFlight.inc({
			service: this.SERVICE_NAME
		})

		const endTimer = this.histogram.startTimer()
		return next.handle().pipe(
			finalize(() => {
				const status = res.statusCode.toString()

				this.counter.inc({
					service: this.SERVICE_NAME,
					method,
					route,
					status
				})

				endTimer({
					service: this.SERVICE_NAME,
					method,
					route,
					status
				})

				this.inFlight.dec({ service: this.SERVICE_NAME })
			})
		)
	}
}
