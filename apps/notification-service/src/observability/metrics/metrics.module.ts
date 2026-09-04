import { Module } from '@nestjs/common'
import {
	makeCounterProvider,
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
			name: 'rmq_event_processing_duration_seconds',
			help: 'RabbitMQ event processing duration',
			labelNames: ['service', 'event'],
			buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
		}),

		makeCounterProvider({
			name: 'rmq_event_total',
			help: 'Total RabbitMQ events processed',
			labelNames: ['service', 'event', 'status']
		}),

		makeCounterProvider({
			name: 'rmq_event_nack_total',
			help: 'Total NACKed RMQ events',
			labelNames: ['service', 'event']
		})
	],
	exports: [
		'PROM_METRIC_RMQ_EVENT_PROCESSING_DURATION_SECONDS',
		'PROM_METRIC_RMQ_EVENT_TOTAL',
		'PROM_METRIC_RMQ_EVENT_NACK_TOTAL'
	]
})
export class MetricsModule {}
