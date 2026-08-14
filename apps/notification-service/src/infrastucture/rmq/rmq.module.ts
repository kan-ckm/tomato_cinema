import { Module } from '@nestjs/common';
import { RmqService } from './rmq.service';
import { RmqController } from './rmq.controller';

@Module({
  controllers: [RmqController],
  providers: [RmqService],
})
export class RmqModule {}
