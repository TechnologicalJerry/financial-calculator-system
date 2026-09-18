import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Service - Privacy Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/privacy-settings')
export class PrivacySettingsController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get privacy settings' })
  getPrivacySettings(@CurrentUser('userId') userId: string) {
    return this.userService.getPrivacySettings(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update privacy settings' })
  updatePrivacySettings(@CurrentUser('userId') userId: string, @Body() body: any) {
    return this.userService.updatePrivacySettings(userId, body);
  }
}
