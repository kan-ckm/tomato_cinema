import { Injectable } from '@nestjs/common'
import { Account } from 'generated/client'
import { PrismaService } from '@/infrastucture/prisma/prisma.service'
import { AccountCreateInput } from 'generated/models'

@Injectable()
export class AuthRepository {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findByPhone(phone: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				phone
			}
		})
	}
	public async findByEmail(email: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				email
			}
		})
	}

    public async create(data: AccountCreateInput) {
        
    }
}
