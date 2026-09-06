import { Global, Module } from '@nestjs/common'
import { HashPasswordService } from './hash-password.service'

@Global()
@Module({
	imports: [],
	providers: [HashPasswordService],
	exports: [HashPasswordService]
})
export class AuthModule {}
