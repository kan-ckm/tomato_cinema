import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportService, TokenPayload } from '@tomatocinema/passport'
import { AllConfig } from 'config/interfaces'

@Injectable()
export class TokenService {
	private readonly ACCESS_TOKEN_TTL: number
	private readonly REFRESH_TOKEN_TTL: number

	public constructor(
		private readonly configService: ConfigService<AllConfig>,
		private readonly passportService: PassportService
	) {
		this.ACCESS_TOKEN_TTL = this.configService.get('passport.accessTtl', {
			infer: true
		})
		this.REFRESH_TOKEN_TTL = this.configService.get('passport.refreshTtl', {
			infer: true
		})
	}

	// hàm tạo accessToken và refreshToken
	public generateTokens(userId: string) {
		const payload: TokenPayload = { sub: userId }

		const accessToken = this.passportService.generate(
			String(payload.sub),
			this.ACCESS_TOKEN_TTL
		)
		const refreshToken = this.passportService.generate(
			String(payload.sub),
			this.REFRESH_TOKEN_TTL
		)

		return { accessToken, refreshToken }
	}
    public verify(token:string) {
        return this.passportService.verify(token)
    }
}
