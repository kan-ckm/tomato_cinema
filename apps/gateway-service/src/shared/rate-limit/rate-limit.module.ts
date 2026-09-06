import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { seconds, ThrottlerModule } from '@nestjs/throttler'
import { AppThrottlerGuard } from './app-throttler.guard'
import { THROTTLER_LIMITS, THROTTLER_NAMES } from './constants'

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{
				name: THROTTLER_NAMES.DEFAULT,
				ttl: seconds(THROTTLER_LIMITS.DEFAULT.ttl / 1000),
				limit: THROTTLER_LIMITS.DEFAULT.limit
			}
		])
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AppThrottlerGuard
		}
	]
})
export class RateLimitModule {}
