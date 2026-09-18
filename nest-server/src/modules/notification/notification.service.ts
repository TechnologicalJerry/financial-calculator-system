import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { SendNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async sendNotification(senderUserId: string, dto: SendNotificationDto) {
    const targetUserId = dto.userId || senderUserId;
    const notification = await this.prisma.notification.create({
      data: {
        userId: targetUserId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'INFO',
        metadataJson: dto.metadataJson,
      },
    });
    return ApiResponse.ok(notification, 'Notification accepted');
  }

  async getUserNotifications(userId: string) {
    const list = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return ApiResponse.ok(list);
  }

  async getUnreadNotifications(userId: string) {
    const list = await this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
    return ApiResponse.ok(list);
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    return ApiResponse.ok(updated, 'Notification marked as read');
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return ApiResponse.ok({ unreadCount: count });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return ApiResponse.ok(null, 'All notifications marked as read');
  }
}
