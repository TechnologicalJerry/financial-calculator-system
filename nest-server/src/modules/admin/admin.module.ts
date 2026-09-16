import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminCompatController } from './admin-compat.controller';
import { AuditLogController } from './audit-log.controller';

@Module({
  controllers: [AdminController, AdminCompatController, AuditLogController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
