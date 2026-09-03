import { Module } from '@nestjs/common'
import { MetricsModule } from './metrics/metrics.module'

/**
 ObservabilityModule: Module tổng hợp toàn bộ các tính năng giám sát (Observability) của Gateway Service.
 Giúp AppModule chính của Gateway chỉ cần import một module duy nhất (`ObservabilityModule`)
thay vì import rời rạc từng module con.**/
@Module({
	imports: [MetricsModule],
	exports: [MetricsModule]
})
export class ObservabilityModule {}
