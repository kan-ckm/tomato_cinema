import { Inject, Injectable } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { PASSPORT_OPTIONS } from './constants'
import { PassportOptions } from './interfaces'
import { base64UrlDecode, base64UrlEncode, constantTimeEqual } from './utils'

/**
 * Service cốt lõi chịu trách nhiệm khởi tạo và xác thực Token.
 * Sử dụng cơ chế mã hóa Base64URL kết hợp với chữ ký điện tử HMAC-SHA256
 * để đảm bảo token an toàn, chống giả mạo và dễ dàng truyền tải qua HTTP.
 */
@Injectable()
export class PassportService {
    private readonly SECRET_KEY: string

    /**
     * Định danh (Namespace) cho loại token này. 
     * @note Việc gắn Domain/Version giúp hệ thống biết token này dùng để làm gì.
     * Tránh lỗi bảo mật Cross-protocol (kẻ gian lấy token reset password đem đi đăng nhập).
     */
    private static readonly HMAC_DOMAIN = 'PassportTokenAuth/v1'

    /**
     * Ký tự dùng để ngăn cách các thành phần dữ liệu trước khi đem đi băm (hash).
     * @note Chọn '|' vì nó hiếm khi xuất hiện trong ID người dùng thông thường.
     */
    private static readonly INTERNAL_SEP = '|'

    public constructor(
        @Inject(PASSPORT_OPTIONS) private readonly options: PassportOptions
    ) {
        this.SECRET_KEY = options.secretKey
    }

    // ==========================================
    // QUY TRÌNH 1: TẠO TOKEN ĐỂ GỬI CHO CLIENT
    // ==========================================

    /**
     * Tạo ra một Token bảo mật để cấp phát cho người dùng (Client).
     * @param userId ID của người dùng (thường lấy từ Database).
     * @param ttl Thời gian sống của token (Time-To-Live) tính bằng giây (Ví dụ: 3600 = 1 giờ).
     * @returns Chuỗi Token hoàn chỉnh có định dạng `userPart.iatPart.expPart.mac`
     */
    public generate(userId: string, ttl: number): string {
        const issuedAt = this.now() // iat: Thời điểm phát hành token (hiện tại)
        const expiresAt = issuedAt + ttl // exp: Thời điểm hết hạn (hiện tại + thời gian sống)

        // Mã hóa 3 thành phần thông tin (Payload) sang Base64URL để giấu cấu trúc thật và an toàn cho Web
        const userPart = base64UrlEncode(userId)
        const iatPart = base64UrlEncode(String(issuedAt))
        const expPart = base64UrlEncode(String(expiresAt))

        // Đóng gói 3 thành phần đó thành chuỗi thô để chuẩn bị ký
        const serialized = this.serialize(userPart, iatPart, expPart)

        // Đóng dấu bảo mật (Tạo chữ ký MAC) dựa trên cấu hình Secret Key
        const mac = this.computeHmac(this.SECRET_KEY, serialized)

        // Ghép 3 thành phần Payload + 1 Chữ ký thành Token hoàn chỉnh (cách nhau bởi dấu chấm)
        return `${userPart}.${iatPart}.${expPart}.${mac}`
    }

    // ==========================================
    // QUY TRÌNH 2: XÁC THỰC TOKEN TỪ CLIENT GỬI LÊN
    // ==========================================

    /**
     * Kiểm tra tính hợp lệ, toàn vẹn và hạn sử dụng của một Token do Client gửi lên.
     * @param token Chuỗi token cần xác thực.
     * @returns Một Object chứa kết quả. Nếu hợp lệ trả về `userId`, nếu sai trả về `reason` (lý do).
     */
    public verify(token: string) {
        // Tách token ra thành mảng thông qua dấu '.'
        const parts = token.split('.')

        // Một token hợp lệ do hệ thống chúng ta sinh ra bắt buộc phải có đúng 4 phần
        if (parts.length !== 4)
            return { valid: false, reason: 'định dạng không hợp lệ' }

        // Gán 4 phần vào 4 biến tương ứng (Destructuring)
        const [userPart, iatPart, expPart, mac] = parts

        // BƯỚC 1: KIỂM TRA CHỮ KÝ (QUAN TRỌNG NHẤT)
        // Lấy 3 phần payload Client gửi lên, tự đóng gói và ký lại bằng Secret Key của Server.
        const serialized = this.serialize(userPart, iatPart, expPart)
        const expectedMac = this.computeHmac(this.SECRET_KEY, serialized)

        // So sánh chữ ký Client gửi lên (mac) với chữ ký Server tự tính toán lại (expectedMac).
        // Nếu khác nhau -> Token đã bị ai đó sửa đổi nội dung, hoặc làm giả.
        // Dùng `constantTimeEqual` để chống lại kiểu tấn công Timing Attack.
        if (!constantTimeEqual(expectedMac, mac))
            return { valid: false, reason: 'chữ ký không hợp lệ' }

        // BƯỚC 2: KIỂM TRA THỜI GIAN
        // Giải mã chuỗi hạn sử dụng (exp) từ Base64 về dạng Số (Number)
        const expNumber = Number(base64UrlDecode(expPart))

        // Đề phòng trường hợp giải mã ra kết quả NaN (Not-a-Number) hoặc vô cực (Infinity)
        if (!Number.isFinite(expNumber))
            return { valid: false, reason: 'lỗi thời gian' }

        // Nếu thời gian hiện tại đã vượt quá mốc hạn sử dụng -> Từ chối
        if (this.now() > expNumber) return { valid: false, reason: 'hết hạn' }

        // Vượt qua mọi trạm kiểm duyệt -> Token hợp lệ 100%, giải mã và trả về ID của người dùng.
        return { valid: true, userId: base64UrlDecode(userPart) }
    }

    /**
     * Lấy thời gian hiện tại chuẩn UNIX Timestamp.
     * @returns Trả về thời gian hiện tại tính bằng Giây (đã bỏ phần mili-giây).
     */
    private now(): number {
        return Math.floor(Date.now() / 1000)
    }

    /**
     * Nối các thông tin lại với nhau theo thứ tự cố định tạo thành một "Chuỗi dữ liệu thô".
     * @example Trả về chuỗi dạng: "PassportTokenAuth/v1|dXNlcjE|170000|173600"
     */
    private serialize(user: string, iat: string, exp: string): string {
        return [PassportService.HMAC_DOMAIN, user, iat, exp].join(
            PassportService.INTERNAL_SEP
        )
    }

    /**
     * Tạo Chữ ký số điện tử (Message Authentication Code - MAC).
     * Dùng thuật toán SHA256 mạnh mẽ kết hợp Secret Key để băm "Chuỗi dữ liệu thô" thành một chuỗi Hex.
     * @note Chỉ ai giữ Secret Key (Server của bạn) mới tạo ra được chữ ký đúng.
     */
    private computeHmac(secretKey: string, data: string): string {
        return createHmac('sha256', secretKey).update(data).digest('hex')
    }
}