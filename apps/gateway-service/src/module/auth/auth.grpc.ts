import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	AuthServiceClient,
	RefreshRequest,
	SendOtpRequest,
	TelegramConsumeRequest,
	TelegramInitResponse,
	TelegramVerifyRequest,
	VerifyOtpRequest
} from '@tomatocinema/contracts/gen/auth'

// Lớp này đóng vai trò là "Máy khách" (gRPC Client) nằm tại API Gateway.
// Nó tiếp nhận dữ liệu từ Controller, sau đó gói ghém và gửi qua gRPC sang Auth-Service.
@Injectable()
export class AuthClientGrpc implements OnModuleInit {
	// Biến chứa các hàm giao tiếp đã được định nghĩa trong file .proto
	private authService?: AuthServiceClient

	public constructor(
		// Tiêm (Inject) gói cấu hình gRPC có tên 'AUTH_PACKAGE' (đã thiết lập ở Module) vào đây
		@Inject('AUTH_PACKAGE') private readonly client: ClientGrpc
	) {}

	// Hàm này tự động chạy ngay khi Gateway vừa khởi động xong
	public onModuleInit() {
		// Móc nối và nạp "bản hợp đồng" AuthService từ gói gRPC vào biến để sử dụng
		this.authService =
			this.client.getService<AuthServiceClient>('AuthService')
	}

	// --- Các hàm bên dưới làm nhiệm vụ: Nhận request -> Bắn sang Auth Service -> Trả kết quả về ---

	public sendOtp(request: SendOtpRequest) {
		// Dấu '?.' giúp chống sập app (báo undefined) nếu authService chưa kịp khởi tạo
		return this.authService?.sendOtp(request)
	}

	public verifyOtp(request: VerifyOtpRequest) {
		return this.authService?.verifyOtp(request)
	}

	public refresh(request: RefreshRequest) {
		return this.authService?.refresh(request)
	}

	public telegramInit() {
		// Gửi một object rỗng {} vì hàm này bên gRPC yêu cầu kiểu google.protobuf.Empty
		return this.authService?.telegramInit({})
	}

	public telegramVerify(request: TelegramVerifyRequest) {
		return this.authService?.telegramVerify(request)
	}

	public telegramConsume(request: TelegramConsumeRequest) {
		return this.authService?.telegramConsume(request)
	}
}
