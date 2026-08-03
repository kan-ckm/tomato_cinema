import { FactoryProvider, ModuleMetadata } from '@nestjs/common'
import { PassportOptions } from './passport-options.interface'

/**
 * Giao diện cấu hình bất đồng bộ (Async Configuration) dành cho PassportModule.
 * Thường được sử dụng làm tham số cho phương thức `PassportModule.registerAsync(...)`.
 * * @example
 * PassportModule.registerAsync({
 * imports: [ConfigModule],
 * useFactory: async (configService: ConfigService) => ({
 * secretKey: configService.get('SECRET_KEY')
 * }),
 * inject: [ConfigService]
 * })
 */
export interface PassportAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	/**
	 * Hàm "nhà máy" (Factory function) chịu trách nhiệm thực thi logic và trả về cấu hình tĩnh `PassportOptions`.
	 * Hàm này có thể xử lý đồng bộ hoặc bất đồng bộ (trả về Promise).
	 * * @param args Các dịch vụ (services) được NestJS tự động tiêm vào, tương ứng với cấu hình `inject`.
	 */
	useFactory: (...args: any[]) => Promise<PassportOptions> | PassportOptions

	/**
	 * Danh sách các Provider (ví dụ: `ConfigService`) cần thiết để chạy hàm `useFactory`.
	 * NestJS sẽ tìm các dịch vụ này trong hệ thống và "bơm" (inject) chúng làm tham số cho `useFactory`.
	 * * @note Thứ tự khai báo trong mảng này bắt buộc phải khớp với thứ tự tham số truyền vào hàm `useFactory`.
	 */
	inject?: FactoryProvider['inject']
}
