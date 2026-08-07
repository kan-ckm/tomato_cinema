import { Injectable } from '@nestjs/common'
import { Account } from 'generated/client'
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
}
