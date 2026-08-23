import { registerAs } from '@nestjs/config'
import { validateEnv } from 'src/shared/utils'
import { DatabaseConfig } from '../interfaces'
import { DatabaseValidator } from '../validators'

export const databaseEnv = registerAs<DatabaseConfig>('database', ()=>{
	const validatedConfig = validateEnv(process.env, DatabaseValidator)
	
	return {
		host: validatedConfig.DATABASE_HOST,
		port: validatedConfig.DATABASE_PORT,
		user: validatedConfig.DATABASE_USERNAME,
		password: validatedConfig.DATABASE_PASSWORD,
		database: validatedConfig.DATABASE_USER,
		logging: validatedConfig.DATABASE_LOGGING,
		sync: validatedConfig.DATABASE_SYNC
	}
})
