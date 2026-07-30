import { HttpStatus } from '@nestjs/common'
import { RpcStatus } from '@tomatocinema/common'

export const grpcToHttpStatus: Record<number, number> = {
	[RpcStatus.OK]: HttpStatus.OK, // 0: Trạng thái thành công (200)
	[RpcStatus.CANCELLED]: 499, // 1: Client hủy request (499 - Nginx standard)
	[RpcStatus.UNKNOWN]: HttpStatus.INTERNAL_SERVER_ERROR, // 2: Lỗi không xác định (500)
	[RpcStatus.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST, // 3: Dữ liệu gửi lên không hợp lệ (400)
	[RpcStatus.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT, // 4: Quá thời gian phản hồi (504)
	[RpcStatus.NOT_FOUND]: HttpStatus.NOT_FOUND, // 5: Không tìm thấy tài nguyên (404)
	[RpcStatus.ALREADY_EXISTS]: HttpStatus.CONFLICT, // 6: Tài nguyên đã tồn tại (409)
	[RpcStatus.PERMISSION_DENIED]: HttpStatus.FORBIDDEN, // 7: Không có quyền truy cập (403)
	[RpcStatus.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS, // 8: Quá giới hạn rate limit (429)
	[RpcStatus.FAILED_PRECONDITION]: HttpStatus.BAD_REQUEST, // 9: Lỗi logic/điều kiện (400)
	[RpcStatus.ABORTED]: HttpStatus.CONFLICT, // 10: Xung đột dữ liệu đồng thời (409)
	[RpcStatus.OUT_OF_RANGE]: HttpStatus.BAD_REQUEST, // 11: Dữ liệu vượt quá giới hạn (400)
	[RpcStatus.UNIMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED, // 12: API chưa được code/hỗ trợ (501)
	[RpcStatus.INTERNAL]: HttpStatus.INTERNAL_SERVER_ERROR, // 13: Lỗi crash server nội bộ (500)
	[RpcStatus.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE, // 14: Service đang sập/bảo trì (503)
	[RpcStatus.DATA_LOSS]: HttpStatus.INTERNAL_SERVER_ERROR, // 15: Mất mát dữ liệu nghiêm trọng (500)
	[RpcStatus.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED // 16: Chưa đăng nhập/Sai Token (401)
}
