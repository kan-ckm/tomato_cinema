/**
 * Mã hóa dữ liệu thành chuỗi Base64URL.
 * Base64 thông thường sinh ra các ký tự '+', '/', '=' có thể làm hỏng cấu trúc URL nếu ta truyền token qua thanh địa chỉ.
 * Hàm này biến đổi chúng thành các ký tự an toàn cho Web ('-', '_') và loại bỏ dấu '=' dư thừa.
 */
export function base64UrlEncode(buf: Buffer | string) {
	// Nếu đầu vào là chữ (string), biến nó thành chuỗi byte (Buffer) để mã hóa.
	const s = typeof buf === 'string' ? Buffer.from(buf) : buf
	return s
		.toString('base64') // Mã hóa ra Base64 chuẩn
		.replace(/\+/g, '-') // Đổi '+' thành '-' để an toàn cho URL
		.replace(/\//g, '_') // Đổi '/' thành '_'
		.replace(/=+$/, '') // Cắt bỏ hết dấu '=' ở cuối chuỗi (phần đệm không cần thiết)
}

/**
 * Giải mã chuỗi Base64URL từ Client gửi lên về lại văn bản gốc.
 * Hàm này làm ngược lại quá trình của hàm Encode phía trên.
 */
export function base64UrlDecode(str: string) {
	// Phục hồi lại ký tự của Base64 chuẩn
	str = str.replace(/-/g, '+').replace(/_/g, '/')

	// Base64 chuẩn yêu cầu độ dài chuỗi phải chia hết cho 4.
	// Nếu thiếu, ta phải tự "bơm" lại các dấu '=' vào cuối để hàm dịch của Nodejs không bị lỗi.
	while (str.length % 4) str += '='

	// Dịch ngược từ Base64 về dạng text con người đọc được (UTF-8)
	return Buffer.from(str, 'base64').toString()
}
