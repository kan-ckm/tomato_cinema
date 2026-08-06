import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RoleUser } from '@tomatocinema/contracts/gen/account'
import { lastValueFrom, Observable } from 'rxjs'
import { AccountClientGrpc } from '../../module/account/account.grpc'
import { ROLES_KEY } from '../decorators'

// kiểm tra và phân quyềnbộ user
@Injectable()
export class RolesGuard implements CanActivate {
	public constructor(
		private readonly reflector: Reflector,
		private readonly accountClient: AccountClientGrpc
	) {}
	//dùng : Promise<boolean> vì đây là hàm bất đồng bộ
	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const required = this.reflector.getAllAndOverride<RoleUser[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()]
		)

		if (!required || required.length === 0) return true

		const request = context.switchToHttp().getRequest()

		const user = request.user

		if (!user) throw new ForbiddenException('Thiếu ngữ cảnh người dùng')

		const account = await lastValueFrom(
			this.accountClient.getAccount({ id: user.id })!
		)

		if (!account) throw new NotFoundException('Tài khoản không tìm thấy')

		if (!required.includes(account.role))
			throw new ForbiddenException(
				'Bạn không có quyền truy cập tài nguyên này'
			)

		return true
	}
}
