import { timingSafeEqual } from 'node:crypto'

/**
 * So sánh 2 chuỗi mã hóa (MAC) một cách an toàn.
 * Kẻ tấn công (Hacker) thường dùng kỹ thuật "Timing Attack": Chúng gửi hàng ngàn token sai và đo
 * xem server phản hồi nhanh hay chậm để đoán dần từng ký tự của chữ ký thật.
 * timingSafeEqual đảm bảo dù đoán đúng hay sai ký tự nào, thời gian Server xử lý và trả về luôn bằng nhau.
 */

export function constantTimeEqual(a: string, b: string) {
	const bufA = Buffer.from(a)
	const bufB = Buffer.from(b)

	// Nếu độ dài khác nhau thì chắc chắn sai, dừng luôn.
	if (bufA.length !== bufB.length) return false

	// So sánh an toàn
	return timingSafeEqual(bufA, bufB)
}
