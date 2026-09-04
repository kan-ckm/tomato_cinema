import { Injectable } from '@nestjs/common'
import { Account } from 'generated/client'
import { AccountCreateInput, AccountUpdateInput } from 'generated/models'
import { PrismaService } from '@/infrastructure/prisma/prisma.service'

/**
 * Repository thao tác với bảng Account qua Prisma
 */
@Injectable()
export class UserRepository {
	public constructor(private readonly prismaService: PrismaService) {}

	/**
	 * Tìm tài khoản theo số điện thoại
	 */
	public async findByPhone(phone: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				phone
			}
		})
	}

	/**
	 * Tìm tài khoản theo email
	 */
	public async findByEmail(email: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				email
			}
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
			where: {
				id
			},
			data
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
	 * Xóa tài khoản (dùng khi rollback nếu microservice phía sau gặp lỗi)
	 */
	public async delete(id: string): Promise<Account> {
		return await this.prismaService.account.delete({
			where: {
				id
			}
		})
	}
}
