import { getPrismaClient } from '@packages/database';
import { Prisma, ReportType } from '@prisma/client';

export interface CreateReportData {
  userId: string;
  reportType: ReportType;
  title: string;
  parameters?: unknown;
  data: unknown;
}

export interface FindReportsOptions {
  page: number;
  limit: number;
  reportType?: ReportType | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountReportsOptions {
  reportType?: ReportType | undefined;
}

export class ReportRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async createReport(data: CreateReportData) {
    return this.prisma.report.create({
      data: {
        userId: data.userId,
        reportType: data.reportType,
        title: data.title,
        parameters: (data.parameters as Prisma.InputJsonValue) || Prisma.JsonNull,
        data: data.data as Prisma.InputJsonValue,
      },
    });
  }

  public async findReportByIdForUser(id: string, userId: string) {
    return this.prisma.report.findFirst({
      where: { id, userId },
    });
  }

  public async findReportsForUser(userId: string, options: FindReportsOptions) {
    const where: Prisma.ReportWhereInput = { userId };
    if (options.reportType) where.reportType = options.reportType;

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.report.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
    });
  }

  public async countReportsForUser(userId: string, options: CountReportsOptions) {
    const where: Prisma.ReportWhereInput = { userId };
    if (options.reportType) where.reportType = options.reportType;

    return this.prisma.report.count({ where });
  }
}

export const reportRepository = new ReportRepository();
