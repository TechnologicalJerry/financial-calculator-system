import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Service - Notification Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/notification-preferences')
export class NotificationPreferencesController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get notification preferences' })
  getNotificationPreferences(@CurrentUser('userId') userId: string) {
    return this.userService.getNotificationPreferences(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update notification preferences' })
  updateNotificationPreferences(@CurrentUser('userId') userId: string, @Body() body: any) {
    return this.userService.updateNotificationPreferences(userId, body);
  }
}
