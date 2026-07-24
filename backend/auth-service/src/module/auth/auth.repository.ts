import { Injectable } from '@nestjs/common'
import { Account } from 'generated/client'
import { AccountCreateInput } from 'generated/models'
import { PrismaService } from '@/infrastucture/prisma/prisma.service'

@Injectable()
export class AuthRepository {
	public constructor(private readonly prismaService: PrismaService) {}
	// logic tìm kiếm số đt
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
	// logic tạo tài khoản

	public async create(data: AccountCreateInput) {
		return await this.prismaService.account.create({
			data
		})
	}
}
