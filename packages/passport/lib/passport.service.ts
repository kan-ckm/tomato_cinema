// Import 2 module bảo mật từ lõi của Node.js:
// - createHmac: Dùng để băm (hash) dữ liệu kèm theo một chìa khóa bí mật (Secret Key).
// - timingSafeEqual: Dùng để so sánh 2 chuỗi an toàn, chống lại kỹ thuật đoán mật khẩu qua thời gian.
import { Inject, Injectable } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { base64UrlDecode, base64UrlEncode, constantTimeEqual } from './utils'
import { PASSPORT_OPTIONS } from './constants'
import { PassportOptions } from './interfaces'

@Injectable()
export class PassportService {
	private readonly SECRET_KEY: string

	// Định danh cho loại token này. Việc gắn Domain/Version giúp hệ thống biết token này dùng để làm gì.
	// Nếu sau này dự án có token cho Mobile (v2) hoặc token Reset Password, ta sẽ đổi chuỗi này
	// để token cũ không bị dùng sai mục đích (tránh lỗi bảo mật Cross-protocol).
	private static readonly HMAC_DOMAIN = 'PassportTokenAuth/v1'

	// Ký tự dùng để ngăn cách các thành phần dữ liệu trước khi đem đi băm (hash).
	// Chọn '|' vì nó hiếm khi xuất hiện trong ID người dùng.
	private static readonly INTERNAL_SEP = '|'

	public constructor(@Inject(PASSPORT_OPTIONS)private readonly options:PassportOptions) {
		this.SECRET_KEY = options.secretKey
	}

	// ==========================================
	// QUY TRÌNH 1: TẠO TOKEN ĐỂ GỬI CHO CLIENT
	// ==========================================
	public generate(userId: string, ttl: number) {
		const issuedAt = this.now() // iat: Thời điểm phát hành token (hiện tại)
		const expiresAt = issuedAt + ttl // exp: Thời điểm hết hạn (hiện tại + thời gian sống)

		// Mã hóa 3 thành phần thông tin (Payload) để giấu đi cấu trúc thật và an toàn cho Web
		const userPart = base64UrlEncode(userId)
		const iatPart = base64UrlEncode(String(issuedAt))
		const expPart = base64UrlEncode(String(expiresAt))

		// Đóng gói 3 thành phần đó thành chuỗi thô
		const serialized = this.serialize(userPart, iatPart, expPart)

		// Đóng dấu bảo mật (Tạo chữ ký)
		const mac = this.computeHmac(this.SECRET_KEY, serialized)

		// Ghép 3 thành phần Payload + 1 Chữ ký thành Token hoàn chỉnh.
		// Các phần cách nhau bởi dấu chấm '.'
		return `${userPart}.${iatPart}.${expPart}.${mac}`
	}

	// ==========================================
	// QUY TRÌNH 2: XÁC THỰC TOKEN TỪ CLIENT GỬI LÊN
	// ==========================================
	public verify(token: string) {
		// Tách token ra thành mảng thông qua dấu '.'
		const parts = token.split('.')

		// Một token hợp lệ hệ thống chúng ta quy định phải có đúng 4 phần
		if (parts.length !== 4)
			return { valid: false, reason: 'định dạng không hợp lệ' }

		// Gán 4 phần vào 4 biến tương ứng (Destructuring)
		const [userPart, iatPart, expPart, mac] = parts

		// BƯỚC 1: KIỂM TRA CHỮ KÝ (QUAN TRỌNG NHẤT)
		// Lấy 3 phần payload Client gửi lên, tự đóng gói và ký lại bằng Secret Key của Server.
		const serialized = this.serialize(userPart, iatPart, expPart)
		const expectedMac = this.computeHmac(this.SECRET_KEY, serialized)

		// So sánh chữ ký Client gửi lên (mac) với chữ ký Server tự tính toán lại (expectedMac).
		// Nếu khác nhau -> Token đã bị ai đó sửa đổi nội dung, hoặc giả mạo.
		if (!constantTimeEqual(expectedMac, mac))
			return { valid: false, reason: 'chữ ký không hợp lệ' }

		// BƯỚC 2: KIỂM TRA THỜI GIAN
		// Giải mã chuỗi hạn sử dụng (exp) từ Base64 về số
		const expNumber = Number(base64UrlDecode(expPart))

		// Đề phòng trường hợp giải mã ra kết quả NaN (Not-a-Number) hoặc vô cực
		if (!Number.isFinite(expNumber))
			return { valid: false, reason: 'lỗi thời gian' }

		// Nếu thời gian hiện tại đã vượt quá mốc hạn sử dụng -> Từ chối
		if (this.now() > expNumber) return { valid: false, reason: 'hết hạn' }

		// Vượt qua mọi trạm kiểm duyệt -> Token hợp lệ, trả về ID của người dùng.
		return { valid: true, userId: base64UrlDecode(userPart) }
	}

	// --- TEST THỬ ỨNG DỤNG ---
	// const SECRET = '123456' // Trong thực tế, chuỗi này phải lưu vào file .env tuyệt đối bảo mật

	// // Tạo ra 1 token sống được 100,000 giây
	// const myToken = generateToken(SECRET, 'user-123', 100000)
	// console.log('TOKEN VỪA TẠO:', myToken)

	// // Xác thực token vừa tạo
	// const verifyResult = verifyToken(SECRET, myToken)
	// console.log('KẾT QUẢ XÁC THỰC:', verifyResult)

	private now() {
		return Math.floor(Date.now() / 1000)
	}

	/**
	 * Lấy thời gian hiện tại chuẩn UNIX Timestamp.
	 * Chia 1000 và làm tròn xuống để bỏ phần mili-giây, chỉ lấy đơn vị Giây.
	 */

	/**
	 * Nối các thông tin lại với nhau theo thứ tự cố định tạo thành một "Chuỗi dữ liệu thô".
	 * Ví dụ: "PassportTokenAuth/v1|dXNlcjE|170000|173600"
	 */
	private serialize(user: string, iat: string, exp: string) {
		return [PassportService.HMAC_DOMAIN, user, iat, exp].join(
			PassportService.INTERNAL_SEP
		)
	}

	/**
	 * Tạo Chữ ký số (Message Authentication Code - MAC).
	 * Dùng thuật toán SHA256 mạnh mẽ kết hợp Secret Key để băm "Chuỗi dữ liệu thô" thành một chuỗi Hex.
	 * Chỉ ai giữ Secret Key (Server của bạn) mới tạo ra được chữ ký đúng.
	 */
	private computeHmac(secretKey: string, data: string) {
		return createHmac('sha256', secretKey).update(data).digest('hex')
	}
}
