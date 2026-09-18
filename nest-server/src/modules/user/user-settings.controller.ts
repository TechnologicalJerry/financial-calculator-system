import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Service - Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/user-settings')
export class UserSettingsController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get user settings' })
  getSettings(@CurrentUser('userId') userId: string) {
    return this.userService.getSettings(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update user settings' })
  updateSettings(@CurrentUser('userId') userId: string, @Body() body: any) {
    return this.userService.updateSettings(userId, body);
  }
}
