import { Controller } from '@nestjs/common';
import { RmqService } from './rmq.service';

@Controller('rmq')
export class RmqController {
  constructor(private readonly rmqService: RmqService) {}
}
