import { Inject, Injectable } from '@nestjs/common'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { PASSPORT_OPTIONS } from './constants'
import { PassportOptions, TokenType } from './interfaces'
import { base64UrlDecode, base64UrlEncode, constantTimeEqual } from './utils'

/**
 * Service cốt lõi chịu trách nhiệm khởi tạo và xác thực Token.
 * Sử dụng cơ chế mã hóa Base64URL kết hợp với chữ ký điện tử HMAC-SHA256
 * để đảm bảo token an toàn, chống giả mạo và dễ dàng truyền tải qua HTTP.
 *
 * Mỗi loại token (access/refresh) sử dụng HMAC Domain riêng biệt
 * để ngăn chặn tấn công Token Type Confusion (dùng lẫn loại token).
 */
@Injectable()
export class PassportService {
	private readonly SECRET_KEY: string

	/**
	 * Bản đồ HMAC Domain cho từng loại token.
	 * Mỗi loại token có Domain riêng để chữ ký HMAC khác nhau hoàn toàn,
	 * ngăn chặn việc dùng Refresh Token thay cho Access Token (và ngược lại).
	 */
	private static readonly HMAC_DOMAINS: Record<TokenType, string> = {
		access: 'PassportAccessToken/v1',
		refresh: 'PassportRefreshToken/v1'
	}

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
	 * @param type Loại token: 'access' (xác thực API) hoặc 'refresh' (làm mới phiên).
	 * @returns Chuỗi Token hoàn chỉnh có định dạng `typePart.userPart.iatPart.expPart.mac`
	 */
	public generate(userId: string, ttl: number, type: TokenType): string {
		const issuedAt = this.now() // iat: Thời điểm phát hành token (hiện tại)
		const expiresAt = issuedAt + ttl // exp: Thời điểm hết hạn (hiện tại + thời gian sống)
		const nonce = randomBytes(6).toString('hex') // Nonce ngẫu nhiên đảm bảo tính duy nhất tuyệt đối

		// Mã hóa 4 thành phần thông tin (Payload) sang Base64URL để giấu cấu trúc thật và an toàn cho Web
		const typePart = base64UrlEncode(type)
		const userPart = base64UrlEncode(userId)
		const iatPart = base64UrlEncode(`${issuedAt}:${nonce}`)
		const expPart = base64UrlEncode(String(expiresAt))

		// Đóng gói 4 thành phần đó thành chuỗi thô để chuẩn bị ký
		const serialized = this.serialize(type, userPart, iatPart, expPart)

		// Đóng dấu bảo mật (Tạo chữ ký MAC) dựa trên cấu hình Secret Key
		const mac = this.computeHmac(this.SECRET_KEY, serialized)

		// Ghép 4 thành phần Payload + 1 Chữ ký thành Token hoàn chỉnh (cách nhau bởi dấu chấm)
		return `${typePart}.${userPart}.${iatPart}.${expPart}.${mac}`
	}

	// ==========================================
	// QUY TRÌNH 2: XÁC THỰC TOKEN TỪ CLIENT GỬI LÊN
	// ==========================================

	/**
	 * Kiểm tra tính hợp lệ, toàn vẹn, loại token và hạn sử dụng của một Token do Client gửi lên.
	 * @param token Chuỗi token cần xác thực.
	 * @param expectedType Loại token mong đợi ('access' hoặc 'refresh').
	 * @returns Một Object chứa kết quả. Nếu hợp lệ trả về `userId`, nếu sai trả về `reason` (lý do).
	 */
	public verify(token: string, expectedType: TokenType) {
		// Tách token ra thành mảng thông qua dấu '.'
		const parts = token.split('.')

		// Một token hợp lệ do hệ thống chúng ta sinh ra bắt buộc phải có đúng 5 phần
		if (parts.length !== 5)
			return { valid: false, reason: 'định dạng không hợp lệ' }

		// Gán 5 phần vào 5 biến tương ứng (Destructuring)
		const [typePart, userPart, iatPart, expPart, mac] = parts

		// BƯỚC 0: KIỂM TRA LOẠI TOKEN
		// Giải mã phần loại token và so sánh với loại mong đợi.
		// Ngăn chặn tấn công Token Type Confusion: dùng Refresh Token thay Access Token.
		const tokenType = base64UrlDecode(typePart)
		if (tokenType !== expectedType)
			return { valid: false, reason: 'loại token không hợp lệ' }

		// BƯỚC 1: KIỂM TRA CHỮ KÝ (QUAN TRỌNG NHẤT)
		// Lấy 4 phần payload Client gửi lên, tự đóng gói và ký lại bằng Secret Key của Server.
		const serialized = this.serialize(
			expectedType,
			userPart,
			iatPart,
			expPart
		)
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
		if (this.now() > expNumber)
			return { valid: false, reason: 'Token hết hạn' }

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
	 * Sử dụng HMAC Domain riêng biệt cho từng loại token (access/refresh).
	 * @example Trả về chuỗi dạng: "PassportAccessToken/v1|dXNlcjE|170000|173600"
	 */
	private serialize(
		type: TokenType,
		user: string,
		iat: string,
		exp: string
	): string {
		const domain = PassportService.HMAC_DOMAINS[type]
		return [domain, user, iat, exp].join(PassportService.INTERNAL_SEP)
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
