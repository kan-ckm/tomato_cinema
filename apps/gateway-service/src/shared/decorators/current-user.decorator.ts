import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Decorator @CurrentUser()
 * Dùng để trích xuất ID của người dùng từ Request gửi lên.
 * Thường được sử dụng trong Controller, ví dụ: getProfile(@CurrentUser() userId: string)
 */
export const CurrentUser = createParamDecorator(
	(_: unknown, ctx: ExecutionContext) => {
		// Chuyển đổi bối cảnh hiện tại sang giao thức HTTP và lấy ra đối tượng Request
		const request = ctx.switchToHttp().getRequest()
		// Lấy thuộc tính id từ object user (thường được AuthGuard gắn vào trước đó)
		// Nếu không có id, trả về null
		return request.user.id ?? null
	}
)
