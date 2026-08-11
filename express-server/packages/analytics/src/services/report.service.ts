import { NotFoundError, ValidationError } from '@packages/errors';
import { reportRepository, ReportRepository } from '../repositories/report.repository.js';
import { analyticsService, AnalyticsService } from './analytics.service.js';
import { createReportSchema, reportQuerySchema } from '../schemas/analytics.schemas.js';

export class ReportService {
  constructor(
    private repository: ReportRepository = reportRepository,
    private aService: AnalyticsService = analyticsService,
  ) {}

  public async createReport(userId: string, rawInput: unknown) {
    const parse = createReportSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid report parameters', parse.error.errors);
    }
    const data = parse.data;

    let reportData: unknown = {};

    switch (data.reportType) {
      case 'FINANCIAL_SUMMARY':
        reportData = await this.aService.getDashboard(userId);
        break;
      case 'NET_WORTH_REPORT':
        reportData = await this.aService.getNetWorth(userId);
        break;
      case 'BUDGET_REPORT':
        reportData = await this.aService.getBudgetAnalytics(userId);
        break;
      case 'GOAL_REPORT':
        reportData = await this.aService.getGoalAnalytics(userId);
        break;
      case 'INVESTMENT_REPORT':
        reportData = await this.aService.getInvestmentAnalytics(userId);
        break;
      default:
        reportData = await this.aService.getDashboard(userId);
    }

    return this.repository.createReport({
      userId,
      reportType: data.reportType,
      title: data.title,
      parameters: data.parameters,
      data: reportData,
    });
  }

  public async listReports(userId: string, rawQuery: unknown) {
    const parse = reportQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid report query parameters', parse.error.errors);
    }
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findReportsForUser(userId, query),
      this.repository.countReportsForUser(userId, query),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  public async getReportDetail(id: string, userId: string) {
    const report = await this.repository.findReportByIdForUser(id, userId);
    if (!report) {
      throw new NotFoundError(`Report '${id}' not found`);
    }
    return report;
  }
}

export const reportService = new ReportService();
