/**
 * Loại token để phân biệt mục đích sử dụng.
 * - 'access': Token ngắn hạn dùng để xác thực các API request
 * - 'refresh': Token dài hạn dùng để cấp lại Access Token mới
 */
export type TokenType = 'access' | 'refresh'

export interface TokenPayload {
	// ID duy nhất của người dùng (User ID)
	sub: string | number
}

/**
 * Kết quả trả về sau khi kiểm tra mã xác minh (OTP, Token).
 * Sử dụng Discriminated Union để TypeScript tự động thu hẹp kiểu dữ liệu (type narrowing).
 */
export type VerifyResult =
	| {
			/** true: Hợp lệ */
			valid: true
			/** ID của người dùng nếu xác minh thành công */
			userId: string
			reason?: never
	  }
	| {
			/** false: Sai hoặc hết hạn */
			valid: false
			/** Lý do lỗi nếu valid = false (VD: "Mã OTP đã hết hạn") */
			reason: string
			userId?: never
	  }
