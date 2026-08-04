import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger
} from '@nestjs/common'
import { Response } from 'express'
import { grpcToHttpStatus } from '../utils'

// Hàm giúp API Gateway tự gom lỗi và dịch ra mã HTTP chuẩn cho Frontend
@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GrpcExceptionFilter.name)

	public catch(exception: any, host: ArgumentsHost) {
		const context = host.switchToHttp()
		const response = context.getResponse<Response>()

		// 1. Xử lý lỗi từ các Microservice nội bộ (gRPC) trả về
		if (this.isGrpcError(exception)) {
			const httpStatus =
				grpcToHttpStatus[exception.code] ||
				HttpStatus.INTERNAL_SERVER_ERROR

			return response.status(httpStatus).json({
				statusCode: httpStatus,
				message: exception.details || 'gRPC error'
			})
		}

		// 2. Xử lý lỗi HTTP thông thường (như lỗi ValidationPipe, Guards,...)
		if (exception instanceof HttpException) {
			const status = exception.getStatus()
			const exceptionResponse: any = exception.getResponse()

			return response.status(status).json({
				statusCode: status, // Fix: Thống nhất dùng statusCode
//  Lấy message chi tiết từ response nếu có (dành cho ValidationPipe)
				message:
					typeof exceptionResponse === 'object' &&
					exceptionResponse.message
						? exceptionResponse.message
						: exception.message
			})
		}

		// 3. Xử lý các lỗi hệ thống không lường trước được (Crash, Unhandled Error)
		// Lưu ý: Thêm exception.stack để log in ra dòng code gây lỗi giúp dễ debug
		this.logger.error(
			`Lỗi hệ thống (500): ${exception.message}`,
			exception.stack
		)

		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Đã xảy ra lỗi hệ thống cục bộ'
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
