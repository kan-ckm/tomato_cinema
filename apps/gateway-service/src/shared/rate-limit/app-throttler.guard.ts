import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { Request } from 'express'
import { RequestTracker } from './trackers/request.tracker'

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
	protected override async getTracker(req: Request): Promise<string> {
		return RequestTracker.resolveKey(req)
	}
}
