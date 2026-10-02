import { defineConfig } from 'prisma/config'

try {
	process.loadEnvFile?.()
} catch {
	// Ignore if .env doesn't exist or environment variables already provided
}

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations'
	},
	datasource: {
		url: process.env['DATABASE_URL']
	}
})
