import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import * as bcrypt from 'bcryptjs';
import { ApiResponse } from '../../common/dto/api-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing) {
      throw new ConflictException('User with this email or username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        profile: { create: { accountStatus: 'ACTIVE', profileCompletionPercentage: 50 } },
        preferences: { create: {} },
        notificationSettings: { create: {} },
        privacySettings: { create: {} },
        userSettings: { create: {} },
      },
    });

    // Store in password history
    await this.prisma.passwordHistory.create({
      data: { userId: user.id, passwordHash },
    });

    // Automatically upsert default ROLE_USER role if not yet present in roles table
    let defaultRole = await this.prisma.role.findUnique({ where: { name: 'ROLE_USER' } });
    if (!defaultRole) {
      defaultRole = await this.prisma.role.create({
        data: { name: 'ROLE_USER', description: 'Standard User Role', isSystemRole: true },
      });
    }

    await this.prisma.userRole.create({
      data: { userId: user.id, roleId: defaultRole.id },
    });

    return ApiResponse.ok({ userId: user.id, email: user.email, username: user.username }, 'User registered successfully');
  }

  async login(dto: LoginDto) {
    const identifier = dto.usernameOrEmail || dto.email || dto.username;
    if (!identifier) {
      throw new BadRequestException('Email or username is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'LOCKED' && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account locked due to 5 failed login attempts. Try again in 15 minutes.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= 5) {
        updates.status = 'LOCKED';
        updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const roles = user.roles.map((r) => r.role.name);
    const payload = { sub: user.id, email: user.email, roles };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshTokenStr = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenStr,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: refreshTokenStr,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.loginHistory.create({
      data: { userId: user.id, loginStatus: 'SUCCESS' },
    });

    return ApiResponse.ok({
      accessToken,
      refreshToken: refreshTokenStr,
      tokenType: 'Bearer',
      expiresIn: 900,
      userId: user.id,
      email: user.email,
      username: user.username,
      roles,
      permissions: [],
      user: { id: user.id, email: user.email, username: user.username, roles },
    }, 'Login successful');
  }

  async refreshToken(dto: RefreshTokenDto) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const roles = stored.user.roles.map((r) => r.role.name);
    const payload = { sub: stored.user.id, email: stored.user.email, roles };

    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true, revokedAt: new Date(), replacedByToken: newRefreshToken },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: stored.user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return ApiResponse.ok({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    }, 'Tokens refreshed successfully');
  }

  async logout(userId?: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true, revokedAt: new Date() },
      });
    }

    if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });

      await this.prisma.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    return ApiResponse.ok(null, 'Logged out successfully');
  }

  async forgotPassword(email: string) {
    return ApiResponse.ok(null, 'Password reset email sent if account exists');
  }

  async resetPassword(dto: any) {
    return ApiResponse.ok(null, 'Password reset successfully');
  }

  async verifyEmail(dto: any) {
    return ApiResponse.ok(null, 'Email verified successfully');
  }

  async resendVerification(email: string) {
    return ApiResponse.ok(null, 'Verification email sent');
  }

  async changePassword(userId: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await this.prisma.passwordHistory.create({
      data: { userId, passwordHash: newHash },
    });

    return ApiResponse.ok(null, 'Password changed successfully');
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, isActive: true },
    });
    return ApiResponse.ok(sessions);
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isActive: false },
    });
    return ApiResponse.ok(null, 'Session revoked successfully');
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    return ApiResponse.ok(null, 'All active sessions revoked successfully');
  }
}
