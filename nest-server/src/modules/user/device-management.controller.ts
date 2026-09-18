import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Service - Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/user-devices')
export class DeviceManagementController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List user devices' })
  getDevices(@CurrentUser('userId') userId: string) {
    return this.userService.getDevices(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove user device' })
  removeDevice(@Param('id') id: string) {
    return this.userService.removeDevice(id);
  }

  @Post(':id/trust')
  @ApiOperation({ summary: 'Mark device as trusted' })
  trustDevice(@Param('id') id: string) {
    return this.userService.trustDevice(id);
  }
}
