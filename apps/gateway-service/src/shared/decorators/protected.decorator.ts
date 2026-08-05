import { applyDecorators, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../guards'

export const Protected = () => applyDecorators(UseGuards(AuthGuard))
