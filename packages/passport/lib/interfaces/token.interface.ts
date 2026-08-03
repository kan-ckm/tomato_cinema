export interface TokenPayload {
	// ID duy nhất của người dùng (User ID)
	sub: string | number
}

/**
 * Kết quả trả về sau khi kiểm tra mã xác minh (OTP, Token).
 */
export interface VerifyResult {
	/** true: Hợp lệ | false: Sai hoặc hết hạn */
	valid: boolean
	/** Lý do lỗi nếu valid = false (VD: "Mã OTP đã hết hạn") */
	reason?: string
	/** ID của người dùng nếu xác minh thành công */
	userId?: string
}
