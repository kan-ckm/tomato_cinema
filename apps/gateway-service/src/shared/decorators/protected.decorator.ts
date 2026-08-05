import { applyDecorators, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../guards'

// Decorator bảo vệ api

export const Protected = () => applyDecorators(UseGuards(AuthGuard))
