import { Module } from '@nestjs/common'
import {
	makeCounterProvider,
	makeGaugeProvider,
	makeHistogramProvider,
	PrometheusModule
} from '@willsoto/nestjs-prometheus'

@Module({
	imports: [
		PrometheusModule.register({
			path: '/metrics',
			defaultMetrics: {
				enabled: true
			}
		})
	],
	providers: [
		makeHistogramProvider({
			name: 'http_request_duration_seconds',
			help: 'HTTP request latency',
			labelNames: ['service', 'method', 'route', 'status']
		}),
		makeGaugeProvider({
			name: 'http_request_in_flight',
			help: 'Current number of in-flight HTTP request'
		}),
		makeCounterProvider({
			name: 'http_request_total',
			help: 'Total HTTP request',
			labelNames: ['service', 'method', 'route', 'status']
		})
	]
})
export class MetricsModule {}
