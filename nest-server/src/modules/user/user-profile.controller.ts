import { Controller, Get, Put, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Service - Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/user-profiles')
export class UserProfileController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get profile of authenticated user' })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update profile of authenticated user' })
  updateProfile(@CurrentUser('userId') userId: string, @Body() body: any) {
    return this.userService.updateProfile(userId, body);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload avatar image for authenticated user' })
  uploadAvatar(@CurrentUser('userId') userId: string, @Body() body: any) {
    return this.userService.updateProfile(userId, { avatarUrl: body?.avatarUrl || '' });
  }

  @Post('me/deactivate')
  @ApiOperation({ summary: 'Deactivate profile of authenticated user' })
  deactivateProfile(@CurrentUser('userId') userId: string) {
    return this.userService.updateProfile(userId, { accountStatus: 'INACTIVE' });
  }

  @Post('me/reactivate')
  @ApiOperation({ summary: 'Reactivate profile of authenticated user' })
  reactivateProfile(@CurrentUser('userId') userId: string) {
    return this.userService.updateProfile(userId, { accountStatus: 'ACTIVE' });
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete profile of authenticated user' })
  deleteProfile(@CurrentUser('userId') userId: string) {
    return this.userService.updateProfile(userId, { accountStatus: 'DELETED' });
  }
}
