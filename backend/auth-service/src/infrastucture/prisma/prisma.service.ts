import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'generated/client'
import { AppModule } from '@/app.module'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name)
	public constructor(private readonly configService: ConfigService) {
		const adapter = new PrismaPg({
			user: configService.getOrThrow<string>('POSTGRES_USER'),
			password: configService.getOrThrow<string>('POSTGRES_PASSOWRD'),
			host: configService.getOrThrow<string>('POSTGRES_HOST'),
			port: configService.getOrThrow<number>('POSTGRES_PORT'),
			database: configService.getOrThrow<string>('POSTGRES_DATABASE')
		})

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
