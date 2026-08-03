import { DynamicModule, Global, Module } from '@nestjs/common'
import { PASSPORT_OPTIONS } from './constants'
import { PassportAsyncOptions, PassportOptions } from './interfaces'
import {
    createPassportAsyncOptionProvider,
    createPassportOptionsProvider
} from './passport.providers'
import { PassportService } from './passport.service'

/**
 * Đánh dấu đây là một Module Toàn cục (Global Module).
 * Khi bạn import và cấu hình module này 1 lần ở cấp cao nhất (ví dụ: AppModule),
 * các Service bên trong nó (như PassportService) sẽ có sẵn ở mọi nơi trong dự án
 * mà không cần phải khai báo lại vào mảng `imports` của các module con khác.
 */
@Global()
@Module({})
export class PassportModule {
    /**
     * Khởi tạo Module với cấu hình tĩnh (Đồng bộ).
     * Sử dụng khi bạn truyền trực tiếp các giá trị cố định (hardcode).
     * * @example
     * PassportModule.register({ secretKey: 'my-super-secret' })
     * * @param options Cấu hình tĩnh chứa `secretKey`.
     * @returns Cấu trúc DynamicModule của NestJS.
     */
    public static register(options: PassportOptions): DynamicModule {
        // Tạo provider để cất cấu hình tĩnh vào IoC Container
        const optionProvider = createPassportOptionsProvider(options)

        return {
            module: PassportModule,
            // Khai báo các Provider để NestJS khởi tạo
            providers: [optionProvider, PassportService],
            // Export ra ngoài để các Module khác có thể sử dụng được PassportService
            exports: [PassportService, PASSPORT_OPTIONS]
        }
    }

    /**
     * Khởi tạo Module với cấu hình động (Bất đồng bộ - Asynchronous).
     * Thường được sử dụng trong thực tế để đọc cấu hình từ file `.env` 
     * thông qua `ConfigService` trước khi khởi tạo module.
     * * @example
     * PassportModule.registerAsync({
     * imports: [ConfigModule],
     * useFactory: (config: ConfigService) => ({ secretKey: config.get('SECRET') }),
     * inject: [ConfigService]
     * })
     * * @param options Đối tượng cấu hình bất đồng bộ (chứa useFactory, inject, imports).
     * @returns Cấu trúc DynamicModule của NestJS.
     */
    public static registerAsync(options: PassportAsyncOptions): DynamicModule {
        // Tạo provider để xử lý việc chờ (await) cấu hình từ Factory
        const optionsProvider = createPassportAsyncOptionProvider(
            options as any // (Ghi chú: dùng as any tạm thời nếu TypeScript chưa nhận diện được ép kiểu khắt khe)
        )

        return {
            module: PassportModule,
            // Import các module phụ trợ (như ConfigModule) cần thiết cho useFactory
            imports: options.imports ?? [],
            // Bơm cấu hình và Service vào hệ thống
            providers: [optionsProvider, PassportService],
            // Xuất Service ra cho toàn hệ thống sử dụng
            exports: [PassportService, PASSPORT_OPTIONS]
        }
    }
}