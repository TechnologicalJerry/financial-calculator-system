import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ApiResponse } from '../../common/dto/api-response.dto.js';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return ApiResponse.ok({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || null,
      status: user.status || 'ACTIVE',
      isMfaEnabled: user.isMfaEnabled || false,
      roles: user.roles.map((r) => r.role.name),
      permissions: [],
      createdAt: user.createdAt,
    });
  }

  async getProfile(userId: string) {
    return this.getCurrentUser(userId);
  }

  async updateProfile(userId: string, data: any) {
    const updated = await this.prisma.userProfile.update({ where: { userId }, data });
    return ApiResponse.ok(updated, 'Profile updated successfully');
  }

  async getSettings(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    return ApiResponse.ok(settings);
  }

  async updateSettings(userId: string, data: any) {
    const updated = await this.prisma.userSettings.update({ where: { userId }, data });
    return ApiResponse.ok(updated, 'Settings updated');
  }

  async getPreferences(userId: string) {
    const prefs = await this.prisma.userPreferences.findUnique({ where: { userId } });
    return ApiResponse.ok(prefs);
  }

  async updatePreferences(userId: string, data: any) {
    const updated = await this.prisma.userPreferences.update({ where: { userId }, data });
    return ApiResponse.ok(updated, 'Preferences updated');
  }

  async getAddresses(userId: string) {
    const addresses = await this.prisma.userAddress.findMany({ where: { userId } });
    return ApiResponse.ok(addresses);
  }

  async createAddress(userId: string, data: any) {
    const addr = await this.prisma.userAddress.create({ data: { ...data, userId } });
    return ApiResponse.ok(addr, 'Address created');
  }

  async updateAddress(id: string, data: any) {
    const updated = await this.prisma.userAddress.update({ where: { id }, data });
    return ApiResponse.ok(updated, 'Address updated');
  }

  async deleteAddress(id: string) {
    await this.prisma.userAddress.delete({ where: { id } });
    return ApiResponse.ok(null, 'Address deleted');
  }

  async setPrimaryAddress(userId: string, id: string) {
    await this.prisma.userAddress.updateMany({ where: { userId }, data: { isPrimary: false } });
    const updated = await this.prisma.userAddress.update({ where: { id }, data: { isPrimary: true } });
    return ApiResponse.ok(updated, 'Primary address updated');
  }

  async getPrivacySettings(userId: string) {
    const privacy = await this.prisma.privacySettings.findUnique({ where: { userId } });
    return ApiResponse.ok(privacy);
  }

  async updatePrivacySettings(userId: string, data: any) {
    const updated = await this.prisma.privacySettings.update({ where: { userId }, data });
    return ApiResponse.ok(updated, 'Privacy settings updated');
  }

  async getNotificationPreferences(userId: string) {
    const notif = await this.prisma.notificationPreferences.findUnique({ where: { userId } });
    return ApiResponse.ok(notif);
  }

  async updateNotificationPreferences(userId: string, data: any) {
    const updated = await this.prisma.notificationPreferences.update({ where: { userId }, data });
    return ApiResponse.ok(updated, 'Notification preferences updated');
  }

  async getDevices(userId: string) {
    const devices = await this.prisma.device.findMany({ where: { userId } });
    return ApiResponse.ok(devices);
  }

  async removeDevice(id: string) {
    await this.prisma.device.delete({ where: { id } });
    return ApiResponse.ok(null, 'Device removed');
  }

  async trustDevice(id: string) {
    const updated = await this.prisma.device.update({ where: { id }, data: { isTrusted: true } });
    return ApiResponse.ok(updated, 'Device marked as trusted');
  }
}
