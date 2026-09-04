import { Global, Module } from '@nestjs/common'
import { RmqService } from './rmq.service'

/**
 * Module toàn cục cung cấp RmqService cho toàn bộ ứng dụng
 */
@Global()
@Module({
	providers: [RmqService],
	exports: [RmqService]
})
export class RmqModule {}
