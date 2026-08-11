import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload, AuthContext } from '@packages/types';
import { AuthenticationError, AuthorizationError, ErrorCode } from '@packages/errors';

export * from './password.js';

export interface TokenConfig {
  secret: string;
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
}

export function signAccessToken(payload: JwtPayload, config: TokenConfig): string {
  const secret: Secret = config.secret;
  const expiry = (config.expiresIn || process.env['JWT_ACCESS_EXPIRES_IN'] || '15m') as NonNullable<SignOptions['expiresIn']>;
  const options: SignOptions = {
    issuer: config.issuer || 'financial-calculator-system',
    expiresIn: expiry,
    ...(config.audience ? { audience: config.audience } : {}),
  };

  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string, secret: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token signature');
    }
    throw new AuthenticationError('Token verification failed');
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthContext;
}

export function authenticateJwt(secret: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AuthenticationError('Missing or invalid Authorization header'));
    }

    const token = authHeader.substring(7);
    try {
      const decoded = verifyAccessToken(token, secret);
      req.user = {
        userId: decoded.sub,
        ...(decoded.email ? { email: decoded.email } : {}),
        roles: decoded.roles || [],
        tokenPayload: decoded,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function optionalAuthenticateJwt(secret: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    try {
      const decoded = verifyAccessToken(token, secret);
      req.user = {
        userId: decoded.sub,
        ...(decoded.email ? { email: decoded.email } : {}),
        roles: decoded.roles || [],
        tokenPayload: decoded,
      };
      next();
    } catch {
      // Ignore token errors for optional auth
      next();
    }
  };
}

export function requireRoles(requiredRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Unauthenticated'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(new AuthorizationError('Insufficient permissions', ErrorCode.ACCOUNT_ACCESS_DENIED));
    }

    next();
  };
}
