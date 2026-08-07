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
	public async findPendingChange(
		accountId: string,
		type: 'email' | 'phone'
	): Promise<PendingContactChange> {
		return this.prismaService.pendingContactChange.findUnique({
			where: {
				accountId_type: {
					accountId,
					type
				}
			}
		})
	}

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
