import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('NestJS Financial Platform (Vitest E2E Tests)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    $connect: async () => {},
    $disconnect: async () => {},
    user: {
      findUnique: async () => null,
      create: async () => ({ id: '1', email: 'test@example.com' }),
    },
    userProfile: {
      findUnique: async () => null,
    },
    financialCalculator: {
      findMany: async () => [],
    },
    calculationHistory: {
      count: async () => 0,
      findMany: async () => [],
    },
    portfolio: {
      count: async () => 0,
    },
    documentFile: {
      count: async () => 0,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/calculator/compound-interest (E2E calculation verification)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/calculator/compound-interest')
      .send({
        principal: 10000,
        annualRate: 7.5,
        years: 10,
        compoundingFrequency: 12,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.futureValue).toBeGreaterThan(10000);
  });

  it('POST /api/v1/calculator/loan-amortization (E2E amortization schedule)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/calculator/loan-amortization')
      .send({
        loanAmount: 250000,
        annualInterestRate: 6.5,
        termYears: 30,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.monthlyPayment).toBeGreaterThan(0);
  });
});
