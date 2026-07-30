import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus
} from '@nestjs/common'
import { Response } from 'express'
import { grpcToHttpStatus } from '../utils'

@Catch()
export class GrcpExceotionFilter implements ExceptionFilter {
	public catch(exception: any, host: ArgumentsHost) {
		const context = host.switchToHttp()
		const response = context.getResponse<Response>()
		if (this.isGrpcError(exception)) {
			const httpStatus = grpcToHttpStatus[exception.code] || 500

			return response.status(httpStatus).json({
				statusCode: httpStatus,
				message: exception.details || 'gRPC error'
			})
		}
		if (exception instanceof HttpException) {
			const status = exception.getStatus()
			return response.status(status).json({
				status: status,
				message: exception.message
			})
		}
		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			statusCode: 500,
			message: 'Lỗi Server'
		})
	}

	private isGrpcError(exception: any): boolean {
		return (
			typeof exception === 'object' &&
			exception !== null &&
			'code' in exception &&
			'details' in exception
		)
	}
}
