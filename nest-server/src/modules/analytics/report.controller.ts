import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExportReportDto, GenerateReportDto } from './dto/history-report.dto';

@ApiTags('Analytics & Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/reports')
export class ReportController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate financial summary report' })
  generateReport(@CurrentUser('userId') userId: string, @Body() dto: GenerateReportDto) {
    return this.analyticsService.generateReport(userId, dto);
  }

  @Post('exports')
  @ApiOperation({ summary: 'Export financial report as PDF / CSV' })
  exportReport(@CurrentUser('userId') userId: string, @Body() dto: ExportReportDto) {
    return this.analyticsService.exportReport(userId, dto);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export financial report as PDF / CSV (Alias for exports)' })
  exportReportAlias(@CurrentUser('userId') userId: string, @Body() dto: ExportReportDto) {
    return this.analyticsService.exportReport(userId, dto);
  }

  @Get(':reportId/download')
  @ApiOperation({ summary: 'Download generated report file' })
  downloadReport(@CurrentUser('userId') userId: string, @Param('reportId') reportId: string) {
    return this.analyticsService.downloadReport(userId, reportId);
  }

  @Get('exports')
  @ApiOperation({ summary: 'List exported financial reports' })
  getExportedReports(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getReports(userId);
  }

  @Get()
  @ApiOperation({ summary: 'List generated financial reports' })
  getReports(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getReports(userId);
  }
}
