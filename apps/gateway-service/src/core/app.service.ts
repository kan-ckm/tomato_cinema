import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
	public getHello(): string {
		return 'Hello World!'
	}

	public health() {
		return {
			status: 'ok',
			timestamp: new Date().toISOString()
		}
	}
}
