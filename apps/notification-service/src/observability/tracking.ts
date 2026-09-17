import { Module, OnModuleInit } from '@nestjs/common'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const traceExporter = new OTLPTraceExporter({
	url: 'http://jaeger:4317'
})

const sdk = new NodeSDK({
	traceExporter,
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: 'notification-service'
	}),
	instrumentations: [
		getNodeAutoInstrumentations({
			'@opentelemetry/instrumentation-http': { enabled: true },
			'@opentelemetry/instrumentation-nestjs-core': {
				enabled: true
			}
		})
	]
})
sdk.start()
