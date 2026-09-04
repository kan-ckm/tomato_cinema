import { ConfigService } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { AllConfigs } from 'src/config'
import { UserEntity } from 'src/modules/users/entites'

export const getTypeOrmConfig = (
	configService: ConfigService<AllConfigs>
): TypeOrmModuleOptions => {
	return {
		type: 'postgres',
		host: configService.get('database.host', { infer: true }),
		port: configService.get('database.port', { infer: true }),
		username: configService.get('database.user', { infer: true }),
		password: configService.get('database.password', { infer: true }),
		database: configService.get('database.database', { infer: true }),
		entities: [UserEntity],
		synchronize: configService.get('database.sync', { infer: true }),
		logging: configService.get('database.logging', { infer: true })
	}
}
