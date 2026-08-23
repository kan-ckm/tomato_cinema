import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm'

@Entity({ name: 'users' })
export class UserEntity {
	@PrimaryGeneratedColumn('uuid')
	public id: string

	@Column({ type: 'varchar', nullable: true })
	public name: string | null

	@Column({ type: 'varchar', nullable: true })
	public avatar: string | null

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	public createAt: Date

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	public updatedAt: Date
}
