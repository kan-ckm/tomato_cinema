import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'generated/client'
import { AllConfigs } from '@/config'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name)
	public constructor(
		private readonly configService: ConfigService<AllConfigs>
	) {
		const adapter = new PrismaPg({
			user: configService.get('database.user', { infer: true }),
			password: configService.get('database.password', { infer: true }),
			host: configService.get('database.host', { infer: true }),
			port: configService.get('database.port', { infer: true }),
			database: configService.get('database.name', { infer: true })
		})

		super({ adapter })
	}
	public async onModuleInit() {
		const startTime = Date.now()
		this.logger.log('connecting to database...')
		try {
			await this.$connect
			const ms = Date.now() - startTime
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
