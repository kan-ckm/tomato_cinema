import { Injectable } from '@nestjs/common'
import { Account } from 'generated/client'
import { AccountCreateInput, AccountUpdateInput } from 'generated/models'
import { PrismaService } from '@/infrastucture/prisma/prisma.service'

@Injectable()
export class UserRepository {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findByPhone(phone: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				phone
			}
		})
	}
	// logic tìm kiếm email

	public async findByEmail(email: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				email
			}
		})
	}

	//logic update tài khoản

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

	// logic tạo tài khoản

	public async create(data: AccountCreateInput): Promise<Account> {
		return await this.prismaService.account.create({
			data
		})
	}
}
