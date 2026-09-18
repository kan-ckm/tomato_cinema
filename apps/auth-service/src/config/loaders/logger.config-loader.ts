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
	const isProd = process.env.NODE_ENV === 'production'

	return {
		pinoHttp: {
			level: process.env.LOG_LEVEL || 'info',
			transport: !isProd
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
			customProps: () => {
				const span = trace.getSpan(context.active())
				return {
					service: 'auth-service',
					...(span ? { trace_id: span.spanContext().traceId } : {})
				}
			},
			autoLogging: {
				ignore: req => req.url?.startsWith('/metrics') ?? false
			}
		}
	}
}
