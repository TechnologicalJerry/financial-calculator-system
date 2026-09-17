import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-production-jwt-key',
    });
  }

  async validate(payload: { sub: string; email: string; roles: string[] }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user || user.status === 'LOCKED' || user.status === 'BANNED') {
      throw new UnauthorizedException('User account is disabled or locked');
    }

    const roles = user.roles.map((r) => r.role.name);
    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles,
    };
  }
}

