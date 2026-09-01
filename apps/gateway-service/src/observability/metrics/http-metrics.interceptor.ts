import { Injectable, NestInterceptor } from '@nestjs/common'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {}
