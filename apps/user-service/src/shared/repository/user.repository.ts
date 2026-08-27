import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserEntity } from 'src/modules/users/entites'
import { Repository } from 'typeorm'

@Injectable()
export class UserRepository {
	public constructor(
		@InjectRepository(UserEntity)
		private readonly repository: Repository<UserEntity>
	) {}

	public findById(id: string) {
		return this.repository.findOne({
			where: {
				id
			}
		})
	}

	public create(data: Partial<UserEntity>) {
		const user = this.repository.create(data)

		return this.repository.save(user)
	}

	public update(id: string, data: Partial<UserEntity>) {
		this.repository.update({ id }, data)
		return this.findById(id)
	}
}
