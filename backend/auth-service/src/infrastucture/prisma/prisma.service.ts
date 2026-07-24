import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit
} from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'generated/client'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name)
	public constructor() {
		const dbUrl = process.env.POSTGRES_URL

		if (!dbUrl) {
			throw new Error('POSTGRES_URL environment variable is not defined!')
		}

		const adapter = new PrismaPg(dbUrl)

		super({ adapter })
	}
	public async onModuleInit() {
		const start = Date.now()
		this.logger.log('connecting to database...')
		try {
			await this.$connect
			const ms = Date.now() - start
			this.logger.log(`database connection established (time=${ms}ms)`)
		} catch (error) {
			this.logger.log('Failed to connect to database:', error)
		}
	}

	public async onModuleDestroy() {
		this.logger.log('Disconnecting from databas...')
		try {
			await this.$disconnect
			this.logger.log('Database connection closed')
		} catch (error) {
			this.logger.log('failed to disconnect from database:', error)
		}
	}
}
