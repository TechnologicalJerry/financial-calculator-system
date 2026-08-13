import { signAccessToken, verifyAccessToken } from '@packages/auth';
import { AuthenticationError } from '@packages/errors';

describe('JWT Utilities Unit Tests', () => {
  const secret = 'super-secret-jwt-key-minimum-32-characters';

  it('should sign and verify access token correctly', () => {
    const payload = { sub: 'user-123', email: 'user@example.com', roles: ['admin'] };
    const token = signAccessToken(payload, { secret, expiresIn: '5m' });

    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token, secret);
    expect(decoded.sub).toBe('user-123');
    expect(decoded.email).toBe('user@example.com');
    expect(decoded.roles).toEqual(['admin']);
  });

  it('should throw AuthenticationError when token signature is invalid', () => {
    const payload = { sub: 'user-123' };
    const token = signAccessToken(payload, { secret });
    const wrongSecret = 'wrong-secret-key-that-does-not-match';

    expect(() => verifyAccessToken(token, wrongSecret)).toThrow(AuthenticationError);
  });
});
