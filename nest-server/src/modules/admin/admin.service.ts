import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true, username: true, status: true, createdAt: true },
    });
    return ApiResponse.ok(users);
  }

  async getAuditLogs() {
    const logs = await this.prisma.auditLog.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
    return ApiResponse.ok(logs);
  }
}
