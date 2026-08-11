import { getPrismaClient } from '@packages/database';
import {
  hashPassword,
  comparePassword,
  hashToken,
  generateRefreshToken,
  signAccessToken,
} from '@packages/auth';
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ErrorCode,
  NotFoundError,
} from '@packages/errors';
import { EventPublisher } from '@packages/messaging';
import { getConfig } from '@packages/config';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export class AuthService {
  private prisma = getPrismaClient();
  private publisher = new EventPublisher();

  public async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictError('User with this email already exists', ErrorCode.USER_ALREADY_EXISTS);
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          status: 'ACTIVE',
        },
      });

      await tx.financialProfile.create({
        data: {
          userId: createdUser.id,
          currency: 'USD',
          country: 'US',
          monthlyIncome: 0,
          monthlyExpenses: 0,
          riskTolerance: 'MEDIUM',
        },
      });

      await tx.financialPreferences.create({
        data: {
          userId: createdUser.id,
          baseCurrency: 'USD',
          locale: 'en-US',
          dateFormat: 'YYYY-MM-DD',
          numberFormat: 'standard',
          timezone: 'UTC',
        },
      });

      return createdUser;
    });

    // Publish event asynchronously
    this.publisher
      .publish({
        exchange: 'amq.direct',
        routingKey: 'user.created',
        message: { userId: user.id, email: user.email, createdAt: user.createdAt },
      })
      .catch(() => {});

    return this.sanitizeUser(user);
  }

  public async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password', ErrorCode.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password', ErrorCode.INVALID_CREDENTIALS);
    }

    if (user.status === 'SUSPENDED') {
      throw new AuthorizationError('Account is suspended', ErrorCode.USER_SUSPENDED);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const config = getConfig();
    const accessToken = signAccessToken(
      { sub: user.id, email: user.email },
      { secret: config.JWT_ACCESS_SECRET, expiresIn: config.JWT_ACCESS_EXPIRES_IN },
    );

    this.publisher
      .publish({
        exchange: 'amq.direct',
        routingKey: 'user.logged_in',
        message: { userId: user.id, loginAt: new Date() },
      })
      .catch(() => {});

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  public async refresh(refreshToken: string) {
    const incomingHash = hashToken(refreshToken);

    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash: incomingHash },
      include: { user: true },
    });

    if (!session) {
      throw new AuthenticationError('Invalid or expired refresh token', ErrorCode.INVALID_REFRESH_TOKEN);
    }

    // Reuse detection: If token was already revoked, revoke all sessions for this user!
    if (session.revokedAt) {
      await this.prisma.refreshSession.updateMany({
        where: { userId: session.userId },
        data: { revokedAt: new Date() },
      });
      throw new AuthenticationError(
        'Refresh token reuse detected. All sessions revoked for security.',
        ErrorCode.REFRESH_TOKEN_REUSED,
      );
    }

    if (session.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired', ErrorCode.INVALID_REFRESH_TOKEN);
    }

    if (session.user.status === 'SUSPENDED') {
      throw new AuthorizationError('Account is suspended', ErrorCode.USER_SUSPENDED);
    }

    // Rotate refresh token
    const newRawRefreshToken = generateRefreshToken();
    const newHash = hashToken(newRawRefreshToken);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const newSession = await this.prisma.refreshSession.create({
      data: {
        userId: session.userId,
        tokenHash: newHash,
        expiresAt: newExpiresAt,
      },
    });

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
        replacedByTokenId: newSession.id,
      },
    });

    const config = getConfig();
    const accessToken = signAccessToken(
      { sub: session.user.id, email: session.user.email },
      { secret: config.JWT_ACCESS_SECRET, expiresIn: config.JWT_ACCESS_EXPIRES_IN },
    );

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  public async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      const incomingHash = hashToken(refreshToken);
      await this.prisma.refreshSession
        .update({
          where: { tokenHash: incomingHash },
          data: { revokedAt: new Date() },
        })
        .catch(() => {});
    }

    if (userId) {
      this.publisher
        .publish({
          exchange: 'amq.direct',
          routingKey: 'user.logged_out',
          message: { userId, logoutAt: new Date() },
        })
        .catch(() => {});
    }

    return { success: true };
  }

  public async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
