import { context, trace } from '@opentelemetry/api'
import type { Params } from 'nestjs-pino'

/**
 * Cấu hình Pino Logger cho Auth Service:
 * - Tự động liên kết log với Trace của OpenTelemetry (Tempo)
 * - Sử dụng pino-pretty có màu sắc khi chạy local development
 * - Xuất JSON thuần khi chạy production trên Docker cho Promtail thu thập
 * - Bỏ qua log từ endpoint /metrics để tránh spam định kỳ
 */
export function getLoggerConfig(): Params {
	// Chỉ bật pino-pretty khi người dùng chủ động chỉ định LOG_PRETTY=true (khi chạy debug local)
	// Mặc định xuất JSON thuần để Promtail thu thập và Grafana Loki parse được các trường
	const isPretty = process.env.LOG_PRETTY === 'true'

	return {
		pinoHttp: {
			level: process.env.LOG_LEVEL || 'info',
			transport: isPretty
				? {
						target: 'pino-pretty',
						options: {
							colorize: true,
							singleLine: true,
							translateTime: 'yyyy-mm-dd HH:MM:ss.l'
						}
					}
				: undefined,
			messageKey: 'msg',
			// mixin được Pino gọi trên TẤT CẢ các câu lệnh log (bao gồm this.logger trong gRPC/Service)
			mixin: () => {
				const span = trace.getSpan(context.active())
				const traceId = span?.spanContext().traceId
				return {
					service: 'auth-service',
					...(traceId ? { trace_id: traceId } : {})
				}
			},
			autoLogging: {
				ignore: req => req.url?.startsWith('/metrics') ?? false
			}
		}
	}
}
