import { CalculationHistoryService, CalculationRepository } from '@packages/calculators';
import { NotFoundError } from '@packages/errors';

describe('Calculation History & Audit Unit Tests', () => {
  let mockRepository: jest.Mocked<CalculationRepository>;
  let historyService: CalculationHistoryService;

  const sampleDate = new Date('2026-08-11T00:00:00.000Z');

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByIdForUser: jest.fn(),
      findManyForUser: jest.fn(),
      countForUser: jest.fn(),
      deleteForUser: jest.fn(),
      createAuditEvent: jest.fn(),
    } as unknown as jest.Mocked<CalculationRepository>;

    historyService = new CalculationHistoryService(mockRepository);
  });

  it('should execute calculation and persist history snapshot with version for authenticated user', async () => {
    const userId = 'user-123';
    const mockRecord = {
      id: 'calc-uuid-1',
      userId,
      calculatorId: 'compound-interest',
      calculatorVersion: '1.0.0',
      status: 'COMPLETED' as const,
      currency: 'USD',
      input: { principal: '1000.00', annualRate: '5', term: 2, termUnit: 'YEARS' },
      result: { interestEarned: '102.50', finalAmount: '1102.50' },
      createdAt: sampleDate,
      updatedAt: sampleDate,
    };

    mockRepository.create.mockResolvedValue(mockRecord);
    mockRepository.createAuditEvent.mockResolvedValue({
      id: 'audit-1',
      calculationId: 'calc-uuid-1',
      userId,
      eventType: 'calculation.created',
      metadata: null,
      createdAt: sampleDate,
    });

    const res = await historyService.executeAndPersist('compound-interest', {
      principal: 1000,
      annualRate: 5,
      term: 2,
      termUnit: 'YEARS',
    }, userId);

    expect(res.id).toBe('calc-uuid-1');
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        calculatorId: 'compound-interest',
        calculatorVersion: '1.0.0',
      }),
    );
    expect(mockRepository.createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        calculationId: 'calc-uuid-1',
        eventType: 'calculation.created',
      }),
    );
  });

  it('should enforce IDOR protection when looking up calculation detail', async () => {
    mockRepository.findByIdForUser.mockResolvedValue(null);

    await expect(
      historyService.getCalculationDetail('calc-uuid-owner-a', 'user-b'),
    ).rejects.toThrow(NotFoundError);

    expect(mockRepository.findByIdForUser).toHaveBeenCalledWith('calc-uuid-owner-a', 'user-b');
  });

  it('should preserve historical calculator version snapshot even if registry version changes', async () => {
    const historicalRecord = {
      id: 'calc-old',
      userId: 'user-1',
      calculatorId: 'loan',
      calculatorVersion: '0.9.0', // Old historical version
      status: 'COMPLETED' as const,
      currency: 'USD',
      input: { principal: '5000.00' },
      result: { periodicPayment: '450.00' },
      createdAt: sampleDate,
      updatedAt: sampleDate,
    };

    mockRepository.findByIdForUser.mockResolvedValue(historicalRecord);

    const detail = await historyService.getCalculationDetail('calc-old', 'user-1');

    expect(detail.calculator.version).toBe('0.9.0');
  });

  it('should list user calculations with pagination metadata', async () => {
    const items = [
      {
        id: 'c1',
        userId: 'u1',
        calculatorId: 'simple-interest',
        calculatorVersion: '1.0.0',
        status: 'COMPLETED' as const,
        currency: 'USD',
        input: {},
        result: {},
        createdAt: sampleDate,
        updatedAt: sampleDate,
      },
    ];

    mockRepository.findManyForUser.mockResolvedValue(items);
    mockRepository.countForUser.mockResolvedValue(1);

    const res = await historyService.listCalculationHistory('u1', { page: 1, limit: 10 });

    expect(res.data.length).toBe(1);
    expect(res.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('should delete user calculation history record and trigger audit event', async () => {
    const deletedRecord = {
      id: 'c-del',
      userId: 'u1',
      calculatorId: 'savings',
      calculatorVersion: '1.0.0',
      status: 'COMPLETED' as const,
      currency: 'USD',
      input: {},
      result: {},
      createdAt: sampleDate,
      updatedAt: sampleDate,
    };

    mockRepository.deleteForUser.mockResolvedValue(deletedRecord);
    mockRepository.createAuditEvent.mockResolvedValue({
      id: 'audit-1',
      calculationId: 'c-del',
      userId: 'u1',
      eventType: 'calculation.deleted',
      metadata: null,
      createdAt: sampleDate,
    });

    const res = await historyService.deleteCalculationHistory('c-del', 'u1');

    expect(res).toEqual({ id: 'c-del', deleted: true });
    expect(mockRepository.deleteForUser).toHaveBeenCalledWith('c-del', 'u1');
    expect(mockRepository.createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        calculationId: 'c-del',
        eventType: 'calculation.deleted',
      }),
    );
  });
});
