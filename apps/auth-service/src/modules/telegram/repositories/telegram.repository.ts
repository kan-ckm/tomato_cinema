import { Injectable } from '@nestjs/common'
import { Account } from 'generated/client'
import { PrismaService } from '@/infrastructure/prisma/prisma.service'

@Injectable()
export class TelegramRepository {
	public constructor(private readonly prismaService: PrismaService) {}
	public async findByTelegramId(telegramId: string): Promise<Account | null> {
		return await this.prismaService.account.findUnique({
			where: {
				telegramId
			}
		})
	}
	/**
	 * Tìm tài khoản theo Telegram ID
	 */
}
