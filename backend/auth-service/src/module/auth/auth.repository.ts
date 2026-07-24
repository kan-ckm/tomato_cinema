import { PrismaService } from '@/infrastucture/prisma/prisma.service';
import { Injectable } from '@nestjs/common'

@Injectable()
export class AuthRepository {
    public constructor (private readonly prismaService: PrismaService) {

    }

    
}
