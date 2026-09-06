import { Injectable } from '@nestjs/common'
import { Account, PendingContactChange } from 'generated/client'
import { AccountCreateInput, AccountUpdateInput } from 'generated/models'
import { PrismaService } from '@/infrastructure/prisma/prisma.service'

/**
 * Repository tập trung toàn bộ truy vấn dữ liệu liên quan đến Account và PendingContactChange.
 * Đóng vai trò là Data Access Layer chuẩn hóa cho domain Account & Auth.
 */
@Injectable()
export class AccountRepository {
	public constructor(private readonly prismaService: PrismaService) {}

	/**
	 * Tìm tài khoản theo ID
	 */
	public async findById(id: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: { id }
		})
	}

	/**
	 * Alias tìm tài khoản theo ID (tương thích ngược)
	 */
	public async findByIdUser(id: string): Promise<Account | null> {
		return await this.findById(id)
	}

	/**
	 * Tìm tài khoản theo Email (đã được chuẩn hóa)
	 */
	public async findByEmail(email: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: { email }
		})
	}

	/**
	 * Tìm tài khoản theo Số điện thoại
	 */
	public async findByPhone(phone: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: { phone }
		})
	}

	/**
	 * Tìm tài khoản theo Telegram ID
	 */
	public async findByTelegramId(telegramId: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: { telegramId }
		})
	}

	/**
	 * Tạo mới tài khoản
	 */
	public async create(data: AccountCreateInput): Promise<Account> {
		return await this.prismaService.account.create({
			data
		})
	}

	/**
	 * Cập nhật thông tin tài khoản
	 */
	public async update(
		id: string,
		data: AccountUpdateInput
	): Promise<Account> {
		return await this.prismaService.account.update({
			where: { id },
			data
		})
	}

	/**
	 * Xóa tài khoản (dùng khi rollback giao dịch liên service)
	 */
	public async delete(id: string): Promise<Account> {
		return await this.prismaService.account.delete({
			where: { id }
		})
	}

	/**
	 * Tìm kiếm yêu cầu đổi thông tin (OTP) đang chờ xử lý
	 */
	public async findPendingChange(
		accountId: string,
		type: 'email' | 'phone'
	): Promise<PendingContactChange | null> {
		return await this.prismaService.pendingContactChange.findUnique({
			where: {
				accountId_type: {
					accountId,
					type
				}
			}
		})
	}

	/**
	 * Tạo mới hoặc Cập nhật yêu cầu thay đổi thông tin (Upsert)
	 */
	public async upsertPendingChange(data: {
		accountId: string
		type: 'email' | 'phone'
		value: string
		codeHash: string
		expiresAt: Date
	}): Promise<PendingContactChange> {
		return await this.prismaService.pendingContactChange.upsert({
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
	 * Xóa yêu cầu thay đổi thông tin sau khi đã xác nhận thành công
	 */
	public async deletePendingChange(
		accountId: string,
		type: 'email' | 'phone'
	): Promise<PendingContactChange> {
		return await this.prismaService.pendingContactChange.delete({
			where: {
				accountId_type: {
					accountId,
					type
				}
			}
		})
	}
}
