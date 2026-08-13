import { hashPassword, comparePassword, hashToken, generateRefreshToken } from '@packages/auth';

describe('Password & Token Crypto Unit Tests', () => {
  it('should hash password and verify matching password correctly', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash).toBeDefined();

    const matches = await comparePassword(rawPassword, hash);
    expect(matches).toBe(true);

    const wrongMatches = await comparePassword('WrongPassword', hash);
    expect(wrongMatches).toBe(false);
  });

  it('should generate random refresh token and hash it deterministically', () => {
    const token = generateRefreshToken();
    expect(token).toHaveLength(64);

    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(token);
  });
});
