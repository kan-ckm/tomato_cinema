import { Injectable } from '@nestjs/common'
import { NoThrottle } from '../shared/rate-limit'

@Injectable()
export class AppService {
	public getHello(): string {
		return 'Hello World!'
	}
	@NoThrottle()
	public health() {
		return {
			status: 'ok',
			timestamp: new Date().toISOString()
		}
	}
}
