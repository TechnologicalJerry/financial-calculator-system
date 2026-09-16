import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Audit logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/audit-logs')
export class AuditLogController {
  constructor(private readonly adminService: AdminService) {}
  @Get() getAuditLogs() { return this.adminService.getAuditLogs(); }
}
