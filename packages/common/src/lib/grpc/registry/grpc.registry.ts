import { PROTO_PATHS } from '@tomatocinema/contracts'

export const GRPC_CLIENT = {
	AUTH_PACKAGE: {
		package: 'auth.v1',
		protoPath: PROTO_PATHS.AUTH,
		env: 'AUTH_GRPC_URL'
	},
	ACCOUNT_PACKAGE: {
		package: 'account.v1',
		protoPath: PROTO_PATHS.ACCOUNT,
		env: 'ACCOUNT_GRPC_URL'
	},
	USERS_PACKAGE: {
		package: 'users.v1',
		protoPath: PROTO_PATHS.USERS,
		env: 'USERS_GRPC_URL'
	}
} as const
