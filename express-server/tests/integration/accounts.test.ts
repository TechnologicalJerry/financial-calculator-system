import request from 'supertest';
import { createApp } from '@packages/http';
import { signAccessToken } from '@packages/auth';
import { getConfig } from '@packages/config';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('@packages/database', () => {
  const mockAccounts = new Map<string, any>();

  const mockPrisma = {
    financialAccount: {
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const result: any[] = [];
        for (const acc of mockAccounts.values()) {
          if (acc.userId === where.userId && acc.isActive === where.isActive) {
            result.push(acc);
          }
        }
        return Promise.resolve(result);
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(mockAccounts.get(where.id) || null);
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const acc = {
          id: `acc-${Date.now()}-${Math.random()}`,
          ...data,
          balance: new Decimal(data.balance || 0),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockAccounts.set(acc.id, acc);
        return Promise.resolve(acc);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const acc = mockAccounts.get(where.id);
        if (acc) {
          Object.assign(acc, data, {
            balance: data.balance !== undefined ? new Decimal(data.balance) : acc.balance,
            updatedAt: new Date(),
          });
        }
        return Promise.resolve(acc);
      }),
    },
  };

  return {
    getPrismaClient: () => mockPrisma,
    connectDatabase: jest.fn(),
    disconnectDatabase: jest.fn(),
    pingDatabase: jest.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
  };
});

describe('Financial Accounts API & IDOR Protection Integration Tests', () => {
  const app = createApp();
  const config = getConfig();

  const userAId = 'user-a-123';
  const userBId = 'user-b-456';

  const userAToken = signAccessToken({ sub: userAId, email: 'usera@example.com' }, { secret: config.JWT_ACCESS_SECRET });
  const userBToken = signAccessToken({ sub: userBId, email: 'userb@example.com' }, { secret: config.JWT_ACCESS_SECRET });

  let userAAccountId: string;

  it('POST /api/v1/accounts should allow User A to create a financial account', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Checking Account',
        type: 'BANK_ACCOUNT',
        institutionName: 'Chase Bank',
        currency: 'USD',
        balance: 1500.5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Checking Account');
    expect(res.body.data.userId).toBe(userAId);
    expect(res.body.data.balance).toBe('1500.5');

    userAAccountId = res.body.data.id;
  });

  it('GET /api/v1/accounts should list accounts belonging to User A', async () => {
    const res = await request(app)
      .get('/api/v1/accounts')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(userAAccountId);
  });

  it('IDOR PROTECTION: GET /api/v1/accounts/:id should DENY User B from accessing User A account', async () => {
    const res = await request(app)
      .get(`/api/v1/accounts/${userAAccountId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_ACCESS_DENIED');
  });

  it('IDOR PROTECTION: PATCH /api/v1/accounts/:id should DENY User B from modifying User A account', async () => {
    const res = await request(app)
      .patch(`/api/v1/accounts/${userAAccountId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Hacked Account Name' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_ACCESS_DENIED');
  });

  it('IDOR PROTECTION: DELETE /api/v1/accounts/:id should DENY User B from deleting User A account', async () => {
    const res = await request(app)
      .delete(`/api/v1/accounts/${userAAccountId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_ACCESS_DENIED');
  });

  it('PATCH /api/v1/accounts/:id should allow User A to update their own account', async () => {
    const res = await request(app)
      .patch(`/api/v1/accounts/${userAAccountId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ balance: 2500.75 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance).toBe('2500.75');
  });

  it('DELETE /api/v1/accounts/:id should allow User A to soft delete their account', async () => {
    const res = await request(app)
      .delete(`/api/v1/accounts/${userAAccountId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
