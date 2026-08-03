/**
 * Mã định danh (Injection Token) độc nhất vô nhị dành cho hệ thống Dependency Injection của NestJS.
 * * Khóa (Token) này đóng vai trò như một "chiếc chìa khóa" dùng để cất giữ và truy xuất
 * các thông số cấu hình (`PassportOptions`) của `PassportModule` từ trong IoC Container.
 * Việc sử dụng `Symbol()` đảm bảo khóa này là duy nhất (unique), loại bỏ hoàn toàn rủi ro
 * bị trùng lặp tên (conflict) với các Module hoặc thư viện bên thứ 3 khác trong dự án Monorepo.
 *
 * @example
 * // Hướng dẫn cách lấy cấu hình ra sử dụng trong Service:
 * @Injectable()
 * export class PassportService {
 * constructor(
 * @Inject(PASSPORT_OPTIONS) private readonly options: PassportOptions
 * ) {}
 * }
 */
export const PASSPORT_OPTIONS = Symbol('PassportOptions')
