import { Injectable } from '@nestjs/common'
import { Account, PendingContactChange } from 'generated/client'
import { PendingContactChangeUpdateInput } from 'generated/models'
import { PrismaService } from '@/infrastucture/prisma/prisma.service'

@Injectable()
export class AccountRepositoty {
	public constructor(private readonly prismaService: PrismaService) {}
	// loggic tìm tài khoản theo ID
	public async findByIdUser(id: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				id
			}
		})
	}

	// Tìm kiếm một yêu cầu đổi thông tin (OTP) đang chờ xử lý của user
	public async findPendingChange(
		accountId: string,
		type: 'email' | 'phone'
	): Promise<PendingContactChange> {
		return this.prismaService.pendingContactChange.findUnique({
			where: {
				// Sử dụng khóa ghép kép (accountId + type) do Prisma tự sinh ra
				// để tìm chính xác yêu cầu của đúng người và đúng loại (email/phone)
				accountId_type: {
					accountId,
					type
				}
			}
		})
	}

	/**
	 * Tạo mới hoặc Cập nhật yêu cầu thay đổi thông tin (Upsert = Update + Insert)
	 * - Nếu user chưa gửi mã bao giờ: Tạo mới (Create).
	 * - Nếu user gửi lại mã lần nữa: Cập nhật mã mới (Update) đè lên mã cũ.
	 */

	public upsertPendingChange(data: {
		accountId: string
		type: 'email' | 'phone'
		value: string
		codeHash: string
		expiresAt: Date
	}): Promise<PendingContactChange> {
		return this.prismaService.pendingContactChange.upsert({
			where: {
				accountId_type: {
					accountId: data.accountId,
					type: data.type
				}
			},
			create: data,
			update: data
		})
	}

	/**
	 * Xóa yêu cầu thay đổi thông tin
	 * (được gọi để "dọn rác" sau khi người dùng đã nhập đúng OTP và đổi thành công)
	 */
	public deletePendingChange(
		accountId: string,
		type: 'email' | 'phone'
	): Promise<PendingContactChange> {
		return this.prismaService.pendingContactChange.delete({
			where: {
				accountId_type: {
					accountId,
					type
				}
			}
		})
	}
}
