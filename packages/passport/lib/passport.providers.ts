import { Provider } from '@nestjs/common'
import { PASSPORT_OPTIONS } from './constants'
import { PassportAsyncOptions, PassportOptions } from './interfaces'

/**
 * Tạo một Provider đồng bộ (Synchronous) cho PassportModule.
 * Thường được sử dụng khi gọi `PassportModule.register(...)` với cấu hình tĩnh đã có sẵn.
 * * @param options Các tùy chọn cấu hình tĩnh cho Passport (ví dụ: { secretKey: "..." }).
 * @returns NestJS Provider sử dụng `useValue`.
 */
export function createPassportOptionsProvider(
	options: PassportOptions
): Provider {
	return {
		// Cất cấu hình vào kho (IoC Container) với mã định danh PASSPORT_OPTIONS
		provide: PASSPORT_OPTIONS,
		// Dùng Object.freeze để "đóng băng" cấu hình, ngăn chặn việc
		// các đoạn code khác vô tình hoặc cố ý sửa đổi thông tin bảo mật lúc runtime.
		useValue: Object.freeze({ ...options })
	}
}

/**
 * Tạo một Provider bất đồng bộ (Asynchronous) cho PassportModule.
 * Thường được sử dụng khi gọi `PassportModule.registerAsync(...)`, cho phép
 * nạp cấu hình từ các dịch vụ bên ngoài (như ConfigService đọc file .env) trước khi khởi tạo.
 * * @param options Đối tượng cấu hình chứa hàm `useFactory` và mảng `inject`.
 * @returns NestJS Provider sử dụng `useFactory`.
 */
export function createPassportAsyncOptionProvider(
	options: PassportAsyncOptions
): Provider {
	return {
		provide: PASSPORT_OPTIONS,
		/**
		 * Hàm "nhà máy" chịu trách nhiệm lấy cấu hình và tiến hành kiểm duyệt (validate).
		 * @param args Các dịch vụ được NestJS tự động bơm vào (tương ứng với mảng `inject` bên dưới).
		 */
		useFactory: async (...args: any[]) => {
			// Chờ hàm do người dùng định nghĩa thực thi để lấy ra cấu hình cuối cùng
			const resolved = await options.useFactory!(...args)

			// Lớp khiên bảo vệ thứ 2: Đảm bảo hệ thống không bao giờ khởi động
			// nếu người dùng quên truyền hoặc truyền sai 'secretKey'.
			if (!resolved || typeof resolved.secretKey !== 'string') {
				throw new Error(
					'[PassportModule] "SecretKey" bắt buộc phải là một chuỗi'
				)
			}

			// Trả về cấu hình hoàn chỉnh và đóng băng nó để đảm bảo tính bất biến (immutable)
			return Object.freeze({ ...resolved })
		},
		// Báo cho NestJS biết cần tìm các Service nào (ví dụ: ConfigService)
		// để bơm vào tham số của hàm useFactory phía trên.
		inject: options.inject ?? []
	}
}
