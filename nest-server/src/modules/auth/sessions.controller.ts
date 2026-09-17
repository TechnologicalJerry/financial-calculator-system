import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Multi-Device Session Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/sessions')
export class SessionsController {
  constructor(private readonly authService: AuthService) {}

  @Get('active')
  @ApiOperation({ summary: 'List active user multi-device sessions' })
  getActiveSessions(@CurrentUser('userId') userId: string) {
    return this.authService.getActiveSessions(userId);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Revoke all active user sessions' })
  revokeAllSessions(@CurrentUser('userId') userId: string) {
    return this.authService.revokeAllSessions(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  revokeSession(@CurrentUser('userId') userId: string, @Param('id') sessionId: string) {
    return this.authService.revokeSession(userId, sessionId);
  }
}
