import { Injectable } from '@nestjs/common'
import { Account } from 'generated/client'
import { PrismaService } from '@/infrastucture/prisma/prisma.service'

@Injectable()
export class AccountRepositoty {
	public constructor(private readonly prismaService: PrismaService) {}
	public async findByIdUser(id: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				id
			}
		})
	}
}
