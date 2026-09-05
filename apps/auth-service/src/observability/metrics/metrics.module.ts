import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import {
	makeCounterProvider,
	makeHistogramProvider,
	PrometheusModule
} from '@willsoto/nestjs-prometheus'
import { GrpcMetricsInterceptor } from './grpc-metrics.interceptor'

const grpcRequestDurationSeconds = makeHistogramProvider({
	name: 'grpc_request_duration_seconds',
	help: 'gRPC request latency in seconds',
	labelNames: ['service', 'method'],
	buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
})
const grpcRequestTotal = makeCounterProvider({
	name: 'grpc_request_total',
	help: 'Total gRPC request',
	labelNames: ['service', 'method', 'status']
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
		grpcRequestDurationSeconds,
		grpcRequestTotal,

		GrpcMetricsInterceptor,
		{
			provide: APP_INTERCEPTOR,
			useClass: GrpcMetricsInterceptor
		}
	],
	exports: [grpcRequestDurationSeconds, grpcRequestTotal]
})
export class MetricsModule {}
