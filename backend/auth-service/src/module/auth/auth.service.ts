import { Injectable } from '@nestjs/common'
import { SendOtpRequest } from '@tomatocinema/contracts/gen/auth'

@Injectable()
export class AuthService {
	public async sendOtp(data: SendOtpRequest) {}
}
