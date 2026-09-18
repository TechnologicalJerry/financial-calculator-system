import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Service - Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/user-preferences')
export class UserPreferencesController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  getPreferences(@CurrentUser('userId') userId: string) {
    return this.userService.getPreferences(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update user preferences' })
  updatePreferences(@CurrentUser('userId') userId: string, @Body() body: any) {
    return this.userService.updatePreferences(userId, body);
  }
}
