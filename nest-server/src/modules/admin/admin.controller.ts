import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all registered users (Admin only)' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'View global system audit logs (Admin only)' })
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
