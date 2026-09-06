import { Module } from '@nestjs/common'
import {
	makeCounterProvider,
	makeHistogramProvider,
	PrometheusModule
} from '@willsoto/nestjs-prometheus'

const rmqProcessingDurationProvider = makeHistogramProvider({
	name: 'rmq_event_processing_duration_seconds',
	help: 'RabbitMQ event processing duration',
	labelNames: ['service', 'event'],
	buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
})

const rmqEventsTotalProvider = makeCounterProvider({
	name: 'rmq_events_total',
	help: 'Total RabbitMQ events processed',
	labelNames: ['service', 'event', 'status']
})

const rmqEventsAckTotalProvider = makeCounterProvider({
	name: 'rmq_events_ack_total',
	help: 'Total ACKed RMQ events',
	labelNames: ['service', 'event']
})

const rmqEventsNackTotalProvider = makeCounterProvider({
	name: 'rmq_events_nack_total',
	help: 'Total NACKed RMQ events',
	labelNames: ['service', 'event']
})

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
		rmqProcessingDurationProvider,
		rmqEventsTotalProvider,
		rmqEventsAckTotalProvider,
		rmqEventsNackTotalProvider
	],
	exports: [
		rmqProcessingDurationProvider,
		rmqEventsTotalProvider,
		rmqEventsAckTotalProvider,
		rmqEventsNackTotalProvider
	]
})
export class MetricsModule {}
