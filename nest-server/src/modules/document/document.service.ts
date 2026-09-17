import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async getDocuments(userId: string) {
    const docs = await this.prisma.documentFile.findMany({ where: { userId } });
    return ApiResponse.ok(docs);
  }
}
