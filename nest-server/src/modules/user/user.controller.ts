import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('User Profile & Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile for React/Angular clients' })
  getCurrentUser(@CurrentUser('userId') userId: string) {
    return this.userService.getCurrentUser(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.userService.updateProfile(userId, data);
  }
}

@ApiTags('User Profile & Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser('userId') userId: string) {
    return this.userService.getCurrentUser(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.userService.updateProfile(userId, data);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user preferences' })
  getPreferences(@CurrentUser('userId') userId: string) {
    return this.userService.getPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update current user preferences' })
  updatePreferences(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.userService.updatePreferences(userId, data);
  }
}
