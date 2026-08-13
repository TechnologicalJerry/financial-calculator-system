import request from 'supertest';
import { createApp } from '@packages/http';

jest.mock('@packages/database', () => {
  const mockUserStore = new Map<string, any>();
  const mockSessionStore = new Map<string, any>();

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where.email) {
          for (const user of mockUserStore.values()) {
            if (user.email === where.email) return Promise.resolve(user);
          }
        }
        if (where.id) {
          return Promise.resolve(mockUserStore.get(where.id) || null);
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const user = {
          id: `user-${Date.now()}-${Math.random()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        };
        mockUserStore.set(user.id, user);
        return Promise.resolve(user);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const user = mockUserStore.get(where.id);
        if (user) {
          Object.assign(user, data, { updatedAt: new Date() });
        }
        return Promise.resolve(user);
      }),
    },
    financialProfile: {
      create: jest.fn().mockResolvedValue({ id: 'prof-1' }),
    },
    financialPreferences: {
      create: jest.fn().mockResolvedValue({ id: 'pref-1' }),
    },
    refreshSession: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const session = {
          id: `sess-${Date.now()}-${Math.random()}`,
          ...data,
          createdAt: new Date(),
          lastUsedAt: new Date(),
          revokedAt: null,
          replacedByTokenId: null,
        };
        mockSessionStore.set(data.tokenHash, session);
        return Promise.resolve(session);
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        const session = mockSessionStore.get(where.tokenHash);
        if (session) {
          const user = mockUserStore.get(session.userId);
          return Promise.resolve({ ...session, user });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        for (const [hash, sess] of mockSessionStore.entries()) {
          if (sess.id === where.id || hash === where.tokenHash) {
            Object.assign(sess, data);
            return Promise.resolve(sess);
          }
        }
        return Promise.resolve(null);
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn().mockImplementation((callback: any) => callback(mockPrisma)),
  };

  return {
    getPrismaClient: () => mockPrisma,
    connectDatabase: jest.fn(),
    disconnectDatabase: jest.fn(),
    pingDatabase: jest.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
  };
});

describe('Authentication API Integration Tests', () => {
  const app = createApp();

  const testUser = {
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('POST /api/v1/auth/register should successfully register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.firstName).toBe(testUser.firstName);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('POST /api/v1/auth/register should fail on duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
  });

  it('POST /api/v1/auth/register should fail on weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: 'other@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login should authenticate user and return access & refresh tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('POST /api/v1/auth/login should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /api/v1/me should return current user profile when authenticated', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const accessToken = loginRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe(testUser.email.toLowerCase());
  });

  it('POST /api/v1/auth/refresh should rotate refresh token and return new access token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const refreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(refreshToken);
  });
});
