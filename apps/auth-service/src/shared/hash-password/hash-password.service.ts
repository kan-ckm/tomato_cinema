import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'

/**
 * Service chuyên biệt chịu trách nhiệm băm và kiểm tra mật khẩu bằng thuật toán Argon2 (Argon2id).
 * Tách biệt khỏi AuthService theo nguyên tắc Single Responsibility Principle (SRP).
 */
@Injectable()
export class HashPasswordService {
	/**
	 * Băm mật khẩu sử dụng thuật toán Argon2id (chuẩn khuyến nghị OWASP)
	 * @param password Mật khẩu văn bản thô
	 * @returns Chuỗi hash an toàn
	 */
	public async hash(password: string): Promise<string> {
		return await argon2.hash(password, {
			type: argon2.argon2id
		})
	}

	/**
	 * So sánh mật khẩu người dùng nhập vào với chuỗi hash đã lưu trong DB
	 * @param password Mật khẩu văn bản thô
	 * @param hash Chuỗi hash cần đối chiếu
	 * @returns true nếu khớp, false nếu sai
	 */
	public async compare(password: string, hash: string): Promise<boolean> {
		try {
			return await argon2.verify(hash, password)
		} catch {
			return false
		}
	}
}
