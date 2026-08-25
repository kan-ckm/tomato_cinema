import { registerAs } from '@nestjs/config'
import { validateEnv } from '@/shared/utils/env'
import { DatabaseConfig } from '../interfaces'
import { DatabaseValidator } from '../validators'

export const databaseEnv = registerAs<DatabaseConfig>('database', () => {
	const validatedConfig = validateEnv(process.env, DatabaseValidator)

	return {
		user: validatedConfig.DATABASE_USERNAME,
		password: validatedConfig.DATABASE_PASSWORD,
		host: validatedConfig.DATABASE_HOST,
		port: validatedConfig.DATABASE_PORT,
		db_name: validatedConfig.DATABASE_NAME
	}
})
