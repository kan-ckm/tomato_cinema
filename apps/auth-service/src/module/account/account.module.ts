import { Module } from '@nestjs/common'
import { AccountController } from './account.controller'
import { AccountRepositoty } from './account.repository'
import { AccountService } from './account.service'

@Module({
	controllers: [AccountController],
	providers: [AccountService, AccountRepositoty]
})
export class AccountModule {}
