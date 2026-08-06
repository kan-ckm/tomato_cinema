import { applyDecorators, UseGuards } from '@nestjs/common'
import { RoleUser } from '@tomatocinema/contracts/gen/account'
import { AuthGuard, RolesGuard } from '../guards'
import { Roles } from './roles.decorators'

// Decorator Composition bảo vệ api và gộp check Auth và check role user

export const Protected = (...roles: RoleUser[]) => {
	if (roles.length === 0) return applyDecorators(UseGuards(AuthGuard))
	return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard))
}
