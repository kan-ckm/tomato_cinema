import { OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { lastValueFrom, Observable } from 'rxjs'

// Helper Type: Tự động "bóc vỏ" Observable<R> để lấy kiểu dữ liệu R bên trong
type UnwrapObservable<U> = U extends Observable<infer R> ? R : U

/**
 * Class trừu tượng cơ sở (Base Class) cho tất cả các gRPC client trong Gateway.
 * Mục đích:
 * 1. Tự động khởi tạo kết nối tới gRPC service khi app chạy (onModuleInit).
 * 2. Đóng gói hàm call(): Chuyển đổi RxJS Observable mặc định của NestJS thành Promise,
 *    giúp Controller/Service gọi gRPC bằng cú pháp async/await tự nhiên.
 * 3. Đảm bảo Type-safe: Tự động gợi ý tên hàm và kiểm tra kiểu dữ liệu đầu vào/ra theo proto.
 */
export abstract class AbstractGrpcClient<
	T extends Record<string, any>
> implements OnModuleInit {
	// Instance gRPC service thực tế sau khi lấy từ proto
	protected service!: T

	protected constructor(
		private readonly client: ClientGrpc, // ClientGrpc do NestJS quản lý
		private readonly serviceName: string // Tên service định nghĩa trong file .proto
	) {}

	// Chạy khi module khởi tạo: Lấy đối tượng service từ gRPC client
	public onModuleInit() {
		this.service = this.client.getService<T>(this.serviceName)
	}

	/**
	 * Gọi một phương thức gRPC theo tên và trả về kết quả dưới dạng Promise.
	 * @param method Tên hàm trong gRPC service (VD: 'ValidateToken', 'FindOne')
	 * @param args Các tham số tương ứng của hàm đó
	 */
	public async call<K extends keyof T>(
		method: K,
		...args: Parameters<T[K]>
	): Promise<UnwrapObservable<ReturnType<T[K]>>> {
		try {
			// Gọi hàm gRPC (mặc định trả về RxJS Observable)
			const observable = this.service[method](...args)

			// Chuyển đổi Observable sang Promise để có thể dùng await
			const result = await lastValueFrom(observable)

			return result as UnwrapObservable<ReturnType<T[K]>>
		} catch (error) {
			throw error
		}
	}
}
