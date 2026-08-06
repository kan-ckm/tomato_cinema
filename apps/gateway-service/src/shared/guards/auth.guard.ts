import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { PassportService } from '@tomatocinema/passport'
import type { Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(private readonly passportService: PassportService) {}
	// sài : boolean vì đây là xử lý đồng bộ
	public canActivate(context: ExecutionContext): boolean {
		// Lấy ra request
		const request = context.switchToHttp().getRequest()

		//  Gọi hàm nội bộ để tách lấy Token
		const token = this.extractToken(request)
		if (!token) throw new UnauthorizedException('Token chưa được cấp')

		// giải mã và kiểm tra token
		const result = this.passportService.verify(token)

		if (!result.valid) {
			throw new UnauthorizedException(result.reason)
		}
		request.user = {
			id: result.userId
		}

		// Bắt buộc phải return true để NestJS biết là Guard đã cho phép đi qua
		return true
	}
	//hàm mở token
	private extractToken(request: Request): string {
		// lấy thông tin từ ngăn authorization trong headers
		const header = request.headers.authorization

		if (!header) throw new UnauthorizedException('Thiếu header xác thực')
		// Bắt lỗi "Đưa nhầm loại vé": Token chuẩn phải bắt đầu bằng chữ Bearer
		if (!header.startsWith('Bearer')) {
			throw new UnauthorizedException('Xác thực không hợp lệ')
		}
		// Bóc tách và làm sạch: Cắt bỏ chữ "Bearer " (không phân biệt hoa/thường) và dọn sạch dấu cách thừa
		const token = header.replace(/^Bearer\s+/i, '').trim()

		if (!token) throw new UnauthorizedException('Token rỗng')

		return token
	}
}
