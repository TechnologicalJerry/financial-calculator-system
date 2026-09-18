import { Body, Controller, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/notification.dto';

@ApiTags('Notification Center')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/notifications')
export class NotificationCompatController {
  constructor(@Inject(NotificationService) private readonly notifications: NotificationService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send notification to user' })
  send(@CurrentUser('userId') userId: string, @Body() dto: SendNotificationDto) {
    return this.notifications.sendNotification(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all notifications for user' })
  all(@CurrentUser('userId') userId: string) {
    return this.notifications.getUserNotifications(userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'List unread notifications for user' })
  unread(@CurrentUser('userId') userId: string) {
    return this.notifications.getUnreadNotifications(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for user' })
  unreadCount(@CurrentUser('userId') userId: string) {
    return this.notifications.getUnreadCount(userId);
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser('userId') userId: string) {
    return this.notifications.markAllAsRead(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  read(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notifications.markAsRead(userId, id);
  }
}
