import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Service - Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/user-addresses')
export class UserAddressController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List user addresses' })
  getAddresses(@CurrentUser('userId') userId: string) {
    return this.userService.getAddresses(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create user address' })
  createAddress(@CurrentUser('userId') userId: string, @Body() body: any) {
    return this.userService.createAddress(userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user address' })
  updateAddress(@Param('id') id: string, @Body() body: any) {
    return this.userService.updateAddress(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user address' })
  deleteAddress(@Param('id') id: string) {
    return this.userService.deleteAddress(id);
  }

  @Put(':id/primary')
  @ApiOperation({ summary: 'Set primary user address' })
  setPrimaryAddress(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.userService.setPrimaryAddress(userId, id);
  }
}
