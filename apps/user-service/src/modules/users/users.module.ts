import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from 'src/modules/users/entites'
import { UserRepository } from 'src/shared/repository'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity])],
	controllers: [UsersController],
	providers: [UsersService, UserRepository]
})
export class UsersModule {}
