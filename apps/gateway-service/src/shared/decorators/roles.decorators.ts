import { SetMetadata } from '@nestjs/common'
import { RoleUser } from '@tomatocinema/contracts/gen/account'

// tạo thẻ @Roles()

export const ROLES_KEY = 'required_roles'
export const Roles = (...roles: RoleUser[]) => SetMetadata(ROLES_KEY, roles)
