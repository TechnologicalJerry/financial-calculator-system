import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { ExportReportDto, GenerateReportDto, SearchHistoryDto } from './dto/history-report.dto';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getDashboardMetrics(userId: string) {
    const portfolioCount = await this.prisma.portfolio.count({ where: { userId } });
    const documentCount = await this.prisma.documentFile.count({ where: { userId } });
    const historyCount = await this.prisma.calculationHistory.count({ where: { userId } });

    return ApiResponse.ok({
      overview: {
        totalPortfolios: portfolioCount,
        totalDocuments: documentCount,
        totalCalculations: historyCount,
        financialHealthScore: 88,
        cashflowStatus: 'POSITIVE',
      },
    });
  }

  async generateReport(userId: string, dto: GenerateReportDto) {
    const report = await this.prisma.reportExport.create({
      data: {
        userId,
        reportType: dto.reportType,
        title: dto.title || `Financial Report - ${dto.reportType}`,
        format: 'PDF',
        status: 'COMPLETED',
      },
    });
    return ApiResponse.ok(report, 'Report generated');
  }

  async exportReport(userId: string, dto: ExportReportDto) {
    const report = await this.prisma.reportExport.create({
      data: {
        userId,
        reportType: dto.reportType,
        title: `Export ${dto.reportType}`,
        format: dto.format || 'PDF',
        status: 'COMPLETED',
      },
    });
    return ApiResponse.ok(
      { downloadUrl: `/api/v1/reports/${report.id}/download`, report },
      'Export generated',
    );
  }

  async downloadReport(userId: string, reportId: string) {
    const report = await this.prisma.reportExport.findFirst({
      where: { id: reportId, userId },
    });
    if (!report) throw new NotFoundException('Report not found');

    return ApiResponse.ok({
      reportId,
      title: report.title,
      format: report.format,
      fileContentBase64: 'JVBERi0xLjQKJS...==', // PDF sample payload
    });
  }

  async getReports(userId: string) {
    const reports = await this.prisma.reportExport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return ApiResponse.ok(reports);
  }

  async getHistory(userId: string) {
    const history = await this.prisma.calculationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return ApiResponse.ok(history);
  }

  async searchHistory(userId: string, dto: SearchHistoryDto) {
    const history = await this.prisma.calculationHistory.findMany({
      where: {
        userId,
        ...(dto.calculatorCode ? { calculatorCode: dto.calculatorCode } : {}),
        ...(dto.query
          ? {
              OR: [
                { calculatorCode: { contains: dto.query, mode: 'insensitive' } },
                { inputsJson: { contains: dto.query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return ApiResponse.ok(history);
  }

  async getHistoryById(userId: string, id: string) {
    const item = await this.prisma.calculationHistory.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Calculation history record not found');
    return ApiResponse.ok(item);
  }

  async deleteHistory(userId: string, id: string) {
    const item = await this.prisma.calculationHistory.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Calculation history record not found');

    await this.prisma.calculationHistory.delete({ where: { id } });
    return ApiResponse.ok(null, 'History log deleted');
  }

  async archiveHistory(userId: string, id: string) {
    const item = await this.prisma.calculationHistory.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Calculation history record not found');

    const updated = await this.prisma.calculationHistory.update({
      where: { id },
      data: { isArchived: true },
    });
    return ApiResponse.ok(updated, 'History log archived');
  }

  async pinHistory(userId: string, id: string) {
    const item = await this.prisma.calculationHistory.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Calculation history record not found');

    const updated = await this.prisma.calculationHistory.update({
      where: { id },
      data: { isPinned: true },
    });
    return ApiResponse.ok(updated, 'History log pinned');
  }

  async restoreHistory(userId: string, id: string) {
    const item = await this.prisma.calculationHistory.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Calculation history record not found');

    const updated = await this.prisma.calculationHistory.update({
      where: { id },
      data: { isArchived: false },
    });
    return ApiResponse.ok(updated, 'History log restored');
  }

  async duplicateHistory(userId: string, id: string) {
    const item = await this.prisma.calculationHistory.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Calculation history record not found');

    const duplicated = await this.prisma.calculationHistory.create({
      data: {
        userId: item.userId,
        calculatorId: item.calculatorId,
        calculatorCode: item.calculatorCode,
        inputsJson: item.inputsJson,
        outputsJson: item.outputsJson,
        executionTimeMs: item.executionTimeMs,
        executionStatus: item.executionStatus,
      },
    });
    return ApiResponse.ok(duplicated, 'History log duplicated');
  }

  async addFavorite(userId: string, historyId: string) {
    const historyItem = await this.prisma.calculationHistory.findFirst({
      where: { id: historyId, userId },
    });
    if (!historyItem) throw new NotFoundException('Calculation history record not found');

    const favorite = await this.prisma.userFavorite.upsert({
      where: {
        userId_historyId: { userId, historyId },
      },
      create: { userId, historyId },
      update: {},
    });
    return ApiResponse.ok(favorite, 'Added to favorites');
  }

  async removeFavorite(userId: string, historyId: string) {
    await this.prisma.userFavorite.deleteMany({
      where: { userId, historyId },
    });
    return ApiResponse.ok(null, 'Removed from favorites');
  }

  async getFavorites(userId: string) {
    const favorites = await this.prisma.userFavorite.findMany({
      where: { userId },
      include: { history: true },
    });
    return ApiResponse.ok(favorites);
  }
}
