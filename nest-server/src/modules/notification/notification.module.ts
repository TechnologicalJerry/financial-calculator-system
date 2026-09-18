import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationCompatController } from './notification-compat.controller';

@Module({
  controllers: [NotificationController, NotificationCompatController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
