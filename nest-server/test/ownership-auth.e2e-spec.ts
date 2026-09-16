import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator.js';
import { Reflector } from '@nestjs/core';

describe('NestJS Authorization & Ownership Verification Tests', () => {
  let app: INestApplication;

  const mockPortfolios: Record<string, any> = {};
  const mockDocuments: Record<string, any> = {};
  const mockInvestmentAccounts: Record<string, any> = {};
  const mockCalculationHistories: Record<string, any> = {};
  const mockNotifications: Record<string, any> = {};
  const mockJobs: Record<string, any> = {
    'job-1': { id: 'job-1', jobName: 'daily-report', status: 'FAILED', retryCount: 0 },
  };

  const mockPrismaService = {
    $connect: async () => {},
    $disconnect: async () => {},
    user: {
      findUnique: async ({ where }: any) => ({
        id: where.id,
        email: 'user@example.com',
        username: 'testuser',
        status: 'ACTIVE',
        createdAt: new Date(),
      }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data }),
    },
    portfolio: {
      findFirst: async ({ where }: any) => {
        const item = mockPortfolios[where.id];
        return item && item.userId === where.userId ? item : null;
      },
      findUnique: async ({ where }: any) => mockPortfolios[where.id] || null,
      create: async ({ data }: any) => {
        const item = { id: data.id || 'p1', ...data };
        mockPortfolios[item.id] = item;
        return item;
      },
    },
    investmentAccount: {
      findFirst: async ({ where }: any) => {
        const item = mockInvestmentAccounts[where.id];
        return item && item.userId === where.userId ? item : null;
      },
      create: async ({ data }: any) => {
        const item = { id: 'acc-1', ...data };
        mockInvestmentAccounts[item.id] = item;
        return item;
      },
      findMany: async () => Object.values(mockInvestmentAccounts),
    },
    investmentHolding: {
      create: async ({ data }: any) => ({ id: 'h-1', ...data }),
      findMany: async ({ where }: any) => [],
    },
    documentFile: {
      findFirst: async ({ where }: any) => {
        const doc = mockDocuments[where.id];
        return doc && doc.userId === where.userId ? doc : null;
      },
      create: async ({ data }: any) => {
        const item = { id: 'doc-1', ...data };
        mockDocuments[item.id] = item;
        return item;
      },
      delete: async ({ where }: any) => {
        delete mockDocuments[where.id];
      },
    },
    calculationHistory: {
      findFirst: async ({ where }: any) => {
        const item = mockCalculationHistories[where.id];
        return item && item.userId === where.userId ? item : null;
      },
      create: async ({ data }: any) => {
        const item = { id: 'hist-1', isArchived: false, isPinned: false, ...data };
        mockCalculationHistories[item.id] = item;
        return item;
      },
      update: async ({ where, data }: any) => {
        const item = mockCalculationHistories[where.id];
        if (item) Object.assign(item, data);
        return item;
      },
    },
    notification: {
      create: async ({ data }: any) => {
        const item = { id: 'notif-1', isRead: false, ...data };
        mockNotifications[item.id] = item;
        return item;
      },
      findMany: async ({ where }: any) => Object.values(mockNotifications).filter((n) => n.userId === where.userId),
      findFirst: async ({ where }: any) => {
        const item = mockNotifications[where.id];
        return item && item.userId === where.userId ? item : null;
      },
      update: async ({ where, data }: any) => {
        const item = mockNotifications[where.id];
        if (item) Object.assign(item, data);
        return item;
      },
    },
    backgroundJob: {
      findMany: async () => Object.values(mockJobs),
      findUnique: async ({ where }: any) => mockJobs[where.id] || null,
      update: async ({ where, data }: any) => {
        const item = mockJobs[where.id];
        if (item) Object.assign(item, data);
        return item;
      },
    },
    aiConversation: {
      create: async ({ data }: any) => ({ id: 'conv-1', ...data }),
      findMany: async () => [],
      findFirst: async () => ({ id: 'conv-1', userId: 'user-a' }),
    },
    aiMessage: {
      create: async ({ data }: any) => ({ id: 'msg-1', ...data }),
      findMany: async () => [],
    },
    aiInsight: {
      create: async ({ data }: any) => ({ id: 'ins-1', ...data }),
      findMany: async () => [],
    },
  };

  let mockCurrentUser = { userId: 'user-a', roles: ['ROLE_USER'] };

  beforeAll(async () => {
    const mockJwtAuthGuard = {
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        req.user = mockCurrentUser;
        return true;
      },
    };

    const reflector = new Reflector();
    const mockRolesGuard = {
      canActivate: (context: any) => {
        const requiredRoles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) return true;
        const req = context.switchToHttp().getRequest();
        if (!req.user || !req.user.roles) throw new ForbiddenException('Insufficient permissions');
        const hasRole = requiredRoles.some((role) => req.user.roles.includes(role));
        if (!hasRole) throw new ForbiddenException('Access denied for user role');
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    // Create initial resources owned by user-a
    mockPortfolios['p-user-a'] = { id: 'p-user-a', userId: 'user-a', name: 'User A Portfolio' };
    mockDocuments['doc-user-a'] = { id: 'doc-user-a', userId: 'user-a', fileName: 'tax.pdf' };
    mockInvestmentAccounts['acc-user-a'] = { id: 'acc-user-a', userId: 'user-a', accountName: '401k' };
    mockCalculationHistories['hist-user-a'] = { id: 'hist-user-a', userId: 'user-a', calculatorCode: 'sip' };
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('Portfolio Access: User A can access own portfolio', async () => {
    mockCurrentUser = { userId: 'user-a', roles: ['ROLE_USER'] };
    const res = await request(app.getHttpServer()).get('/api/v1/portfolios/p-user-a').expect(200);
    expect(res.body.success).toBe(true);
  });

  it('Portfolio Isolation: User B cannot access User A portfolio (404 Not Found)', async () => {
    mockCurrentUser = { userId: 'user-b', roles: ['ROLE_USER'] };
    await request(app.getHttpServer()).get('/api/v1/portfolios/p-user-a').expect(404);
  });

  it('Document Isolation: User B cannot delete User A document file (404 Not Found)', async () => {
    mockCurrentUser = { userId: 'user-b', roles: ['ROLE_USER'] };
    await request(app.getHttpServer()).delete('/api/v1/documents/doc-user-a').expect(404);
  });

  it('Investment Isolation: User B cannot query holdings of User A account (404 Not Found)', async () => {
    mockCurrentUser = { userId: 'user-b', roles: ['ROLE_USER'] };
    await request(app.getHttpServer()).get('/api/v1/investments/accounts/acc-user-a/holdings').expect(404);
  });

  it('Admin RBAC Guard: Non-admin User A is blocked from /api/v1/admin/users/:id (403 Forbidden)', async () => {
    mockCurrentUser = { userId: 'user-a', roles: ['ROLE_USER'] };
    await request(app.getHttpServer()).get('/api/v1/admin/users/user-a').expect(403);
  });

  it('Admin RBAC Guard: Admin user can access /api/v1/admin/jobs', async () => {
    mockCurrentUser = { userId: 'admin-1', roles: ['ROLE_ADMIN'] };
    const res = await request(app.getHttpServer()).get('/api/v1/admin/jobs').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('Admin Jobs Persistence: Admin can retry job', async () => {
    mockCurrentUser = { userId: 'admin-1', roles: ['ROLE_ADMIN'] };
    const res = await request(app.getHttpServer()).post('/api/v1/admin/jobs/job-1/retry').expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('History State Toggle: User A can archive and pin calculation history', async () => {
    mockCurrentUser = { userId: 'user-a', roles: ['ROLE_USER'] };
    const archiveRes = await request(app.getHttpServer()).put('/api/v1/history/hist-user-a/archive').expect(200);
    expect(archiveRes.body.data.isArchived).toBe(true);

    const pinRes = await request(app.getHttpServer()).put('/api/v1/history/hist-user-a/pin').expect(200);
    expect(pinRes.body.data.isPinned).toBe(true);
  });

  it('Notifications State: Send and mark as read', async () => {
    mockCurrentUser = { userId: 'user-a', roles: ['ROLE_USER'] };
    const sendRes = await request(app.getHttpServer())
      .post('/api/v1/notifications/send')
      .send({ title: 'Alert', message: 'Low balance' })
      .expect(201);

    const notifId = sendRes.body.data.id;
    const readRes = await request(app.getHttpServer()).put(`/api/v1/notifications/${notifId}/read`).expect(200);
    expect(readRes.body.data.isRead).toBe(true);
  });
});
