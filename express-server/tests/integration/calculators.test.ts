import request from 'supertest';
import { createApp } from '@packages/http';

jest.mock('@packages/database');
jest.mock('@packages/redis');
jest.mock('@packages/messaging');

describe('Calculator Endpoints Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /api/v1/calculators should return list of available calculators', async () => {
    const res = await request(app).get('/api/v1/calculators');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(7);
  });

  it('GET /api/v1/calculators/compound-interest should return calculator metadata', async () => {
    const res = await request(app).get('/api/v1/calculators/compound-interest');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('compound-interest');
    expect(res.body.data.name).toBeDefined();
  });

  it('GET /api/v1/calculators/invalid-id should return 404', async () => {
    const res = await request(app).get('/api/v1/calculators/invalid-id');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CALCULATOR_NOT_FOUND');
  });

  it('POST /api/v1/calculators/simple-interest/calculate should return simple interest result', async () => {
    const res = await request(app)
      .post('/api/v1/calculators/simple-interest/calculate')
      .send({
        principal: 1000,
        annualRate: 5,
        term: 2,
        termUnit: 'YEARS',
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.calculator.id).toBe('simple-interest');
    expect(res.body.data.result.interestEarned).toBe('100.00');
    expect(res.body.data.result.finalAmount).toBe('1100.00');
    expect(res.body.data.metadata.currency).toBe('USD');
  });

  it('POST /api/v1/calculators/compound-interest/calculate should return compound interest result', async () => {
    const res = await request(app)
      .post('/api/v1/calculators/compound-interest/calculate')
      .send({
        principal: 5000,
        annualRate: 6,
        term: 5,
        termUnit: 'YEARS',
        compoundingFrequency: 'MONTHLY',
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.calculator.id).toBe('compound-interest');
    expect(res.body.data.result.finalAmount).toBeDefined();
  });

  it('POST /api/v1/calculators/loan/calculate should return loan payment schedule', async () => {
    const res = await request(app)
      .post('/api/v1/calculators/loan/calculate')
      .send({
        principal: 20000,
        annualInterestRate: 4.5,
        term: 3,
        termUnit: 'YEARS',
        paymentFrequency: 'MONTHLY',
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.periodicPayment).toBeDefined();
    expect(res.body.data.result.numberOfPayments).toBe(36);
  });

  it('POST /api/v1/calculators/mortgage/calculate should calculate home mortgage', async () => {
    const res = await request(app)
      .post('/api/v1/calculators/mortgage/calculate')
      .send({
        homePrice: 400000,
        downPayment: 80000,
        annualInterestRate: 6.5,
        loanTerm: 30,
        propertyTax: 4800,
        homeInsurance: 1500,
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.loanAmount).toBe('320000.00');
    expect(res.body.data.result.totalPeriodicPayment).toBeDefined();
  });

  it('POST /api/v1/calculators/investment/calculate should calculate investment growth', async () => {
    const res = await request(app)
      .post('/api/v1/calculators/investment/calculate')
      .send({
        initialInvestment: 10000,
        periodicContribution: 500,
        annualReturnRate: 7.5,
        term: 10,
        termUnit: 'YEARS',
        contributionFrequency: 'MONTHLY',
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.finalValue).toBeDefined();
  });

  it('POST /api/v1/calculators/savings/calculate should calculate savings accumulation', async () => {
    const res = await request(app)
      .post('/api/v1/calculators/savings/calculate')
      .send({
        initialSavings: 2000,
        periodicContribution: 150,
        annualInterestRate: 2.5,
        term: 3,
        termUnit: 'YEARS',
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.finalBalance).toBeDefined();
  });

  it('POST /api/v1/calculators/retirement/calculate should project retirement balance', async () => {
    const res = await request(app)
      .post('/api/v1/calculators/retirement/calculate')
      .send({
        currentAge: 25,
        retirementAge: 65,
        currentSavings: 15000,
        monthlyContribution: 400,
        expectedAnnualReturn: 8,
        expectedAnnualInflation: 2,
        currency: 'USD',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result.yearsUntilRetirement).toBe(40);
    expect(res.body.data.result.projectedRetirementSavings).toBeDefined();
  });

  it('POST /api/v1/calculators/loan/calculate should return 400 validation error for negative principal', async () => {
    const res = await request(app)
      .post('/api/v1/calculators/loan/calculate')
      .send({
        principal: -5000,
        annualInterestRate: 5,
        term: 2,
        termUnit: 'YEARS',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
