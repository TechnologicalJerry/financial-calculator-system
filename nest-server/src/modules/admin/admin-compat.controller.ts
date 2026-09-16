import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateApprovalDto,
  CreateFeatureFlagDto,
  CreateFormulaDto,
  CreateRoleDto,
  CreateTaxRuleDto,
  ToggleFeatureFlagDto,
  UpdateRolePermissionsDto,
  UpdateUserStatusDto,
  UpsertConfigsDto,
} from './dto/admin-compat.dto';

@ApiTags('Admin Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')
@Controller('api/v1/admin')
export class AdminCompatController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user administration info' })
  user(@Param('userId') id: string) {
    return this.prisma.user
      .findUnique({ where: { id }, select: { id: true, email: true, username: true, status: true, createdAt: true } })
      .then((d) => ApiResponse.ok(d));
  }

  @Put('users/:userId/status')
  @ApiOperation({ summary: 'Update user account status' })
  status(@Param('userId') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.prisma.user.update({ where: { id }, data: { status: dto.status } }).then((d) => ApiResponse.ok(d));
  }

  @Post('users/:userId/force-logout')
  @ApiOperation({ summary: 'Force logout user sessions' })
  async forceLogout(@Param('userId') userId: string) {
    await this.prisma.session.updateMany({ where: { userId }, data: { isActive: false } });
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true, revokedAt: new Date() } });
    return ApiResponse.ok(null, 'User sessions revoked');
  }

  @Get('tax-rules')
  @ApiOperation({ summary: 'List tax rules' })
  taxRules() {
    return this.prisma.taxRuleSet.findMany().then((d) => ApiResponse.ok(d));
  }

  @Post('tax-rules')
  @ApiOperation({ summary: 'Create tax rule' })
  taxRule(@Body() dto: CreateTaxRuleDto) {
    return this.prisma.taxRuleSet.create({ data: dto }).then((d) => ApiResponse.ok(d));
  }

  @Put('tax-rules/:taxRuleId/publish')
  @ApiOperation({ summary: 'Publish tax rule' })
  publishTaxRule(@Param('taxRuleId') id: string) {
    return this.prisma.taxRuleSet.findUnique({ where: { id } }).then((d) => ApiResponse.ok(d, 'Tax rule published'));
  }

  @Get('roles')
  @ApiOperation({ summary: 'List system roles' })
  roles() {
    return this.prisma.role
      .findMany({ include: { permissions: { include: { permission: true } } } })
      .then((d) => ApiResponse.ok(d));
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create role' })
  role(@Body() dto: CreateRoleDto) {
    return this.prisma.role
      .create({ data: { name: dto.name, description: dto.description, isSystemRole: dto.isSystemRole ?? false } })
      .then((d) => ApiResponse.ok(d));
  }

  @Put('roles/:roleId/permissions')
  @ApiOperation({ summary: 'Update permissions for role' })
  async permissions(@Param('roleId') roleId: string, @Body() dto: UpdateRolePermissionsDto) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: (dto.permissionIds ?? []).map((permissionId) => ({ roleId, permissionId })),
    });
    return ApiResponse.ok(null, 'Role permissions updated');
  }

  @Delete('roles/:roleId')
  @ApiOperation({ summary: 'Delete role' })
  deleteRole(@Param('roleId') id: string) {
    return this.prisma.role.delete({ where: { id } }).then(() => ApiResponse.ok(null, 'Role deleted'));
  }

  @Get('roles/permissions')
  @ApiOperation({ summary: 'List system permissions' })
  permissionsList() {
    return this.prisma.permission.findMany().then((d) => ApiResponse.ok(d));
  }

  // --- Background Jobs Persistent Endpoints ---

  @Get('jobs')
  @ApiOperation({ summary: 'List background jobs' })
  async jobs() {
    const jobs = await this.prisma.backgroundJob.findMany({ orderBy: { createdAt: 'desc' } });
    return ApiResponse.ok(jobs);
  }

  @Post('jobs/:jobId/retry')
  @ApiOperation({ summary: 'Retry background job' })
  async retryJob(@Param('jobId') id: string) {
    const job = await this.prisma.backgroundJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Background job not found');

    const updated = await this.prisma.backgroundJob.update({
      where: { id },
      data: {
        status: 'PENDING',
        retryCount: job.retryCount + 1,
        startedAt: null,
        completedAt: null,
      },
    });
    return ApiResponse.ok(updated, 'Background job retried');
  }

  @Post('jobs/:jobId/cancel')
  @ApiOperation({ summary: 'Cancel background job' })
  async cancelJob(@Param('jobId') id: string) {
    const job = await this.prisma.backgroundJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Background job not found');

    const updated = await this.prisma.backgroundJob.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return ApiResponse.ok(updated, 'Background job cancelled');
  }

  // --- Formulas & Feature Flags ---

  @Get('formulas/:formulaCode')
  @ApiOperation({ summary: 'Get formula details' })
  formula(@Param('formulaCode') code: string) {
    return this.prisma.formulaTemplate
      .findUnique({ where: { code }, include: { versions: true } })
      .then((d) => ApiResponse.ok(d));
  }

  @Post('formulas')
  @ApiOperation({ summary: 'Create formula template' })
  createFormula(@Body() dto: CreateFormulaDto) {
    return this.prisma.formulaTemplate
      .create({ data: { calculatorId: dto.calculatorId, code: dto.code, name: dto.name, expression: dto.expression } })
      .then((d) => ApiResponse.ok(d));
  }

  @Put('formulas/:formulaId/publish')
  @ApiOperation({ summary: 'Publish formula template' })
  publishFormula(@Param('formulaId') id: string) {
    return this.prisma.formulaTemplate.findUnique({ where: { id } }).then((d) => ApiResponse.ok(d, 'Formula published'));
  }

  @Post('formulas/:formulaCode/rollback')
  @ApiOperation({ summary: 'Rollback formula template' })
  rollback(@Param('formulaCode') code: string) {
    return this.prisma.formulaTemplate
      .findUnique({ where: { code }, include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } })
      .then((d) => ApiResponse.ok(d));
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'List feature flags' })
  flags() {
    return this.prisma.featureFlag.findMany().then((d) => ApiResponse.ok(d));
  }

  @Post('feature-flags')
  @ApiOperation({ summary: 'Create feature flag' })
  flag(@Body() dto: CreateFeatureFlagDto) {
    return this.prisma.featureFlag
      .create({
        data: {
          keyName: dto.keyName,
          isEnabled: dto.isEnabled ?? false,
          rolloutPercentage: dto.rolloutPercentage ?? 100,
          targetRoles: dto.targetRoles,
        },
      })
      .then((d) => ApiResponse.ok(d));
  }

  @Put('feature-flags/:flagId/toggle')
  @ApiOperation({ summary: 'Toggle feature flag state' })
  toggle(@Param('flagId') id: string, @Body() dto: ToggleFeatureFlagDto) {
    return this.prisma.featureFlag
      .update({ where: { id }, data: { isEnabled: dto.isEnabled } })
      .then((d) => ApiResponse.ok(d));
  }

  @Get('feature-flags/evaluate/:keyName')
  @ApiOperation({ summary: 'Evaluate feature flag for key' })
  evaluateFlag(@Param('keyName') keyName: string) {
    return this.prisma.featureFlag
      .findUnique({ where: { keyName } })
      .then((d) => ApiResponse.ok({ keyName, enabled: d?.isEnabled ?? false }));
  }

  @Get('approvals')
  @ApiOperation({ summary: 'List approval workflows' })
  approvals() {
    return this.prisma.approvalWorkflow.findMany().then((d) => ApiResponse.ok(d));
  }

  @Post('approvals')
  @ApiOperation({ summary: 'Create approval workflow' })
  approval(@Body() dto: CreateApprovalDto) {
    return this.prisma.approvalWorkflow
      .create({ data: { entityType: dto.entityType, entityId: dto.entityId, requestedBy: dto.requestedBy } })
      .then((d) => ApiResponse.ok(d));
  }

  @Put('approvals/:requestId/approve')
  @ApiOperation({ summary: 'Approve workflow request' })
  approve(@Param('requestId') id: string, @Body() body: any) {
    return this.prisma.approvalWorkflow
      .update({ where: { id }, data: { status: 'APPROVED', approvedBy: body.approvedBy } })
      .then((d) => ApiResponse.ok(d));
  }

  @Put('approvals/:requestId/reject')
  @ApiOperation({ summary: 'Reject workflow request' })
  reject(@Param('requestId') id: string) {
    return this.prisma.approvalWorkflow
      .update({ where: { id }, data: { status: 'REJECTED' } })
      .then((d) => ApiResponse.ok(d));
  }

  @Get('configs')
  @ApiOperation({ summary: 'List system configurations' })
  configs() {
    return this.prisma.systemConfig.findMany({ where: { isSecret: false } }).then((d) => ApiResponse.ok(d));
  }

  @Put('configs')
  @ApiOperation({ summary: 'Upsert system configurations' })
  async configsUpdate(@Body() dto: UpsertConfigsDto) {
    const saved = await Promise.all(
      (dto.configs ?? []).map((c) =>
        this.prisma.systemConfig.upsert({
          where: { configKey: c.configKey },
          create: { configKey: c.configKey, configValue: c.configValue, category: c.category ?? 'GENERAL' },
          update: { configValue: c.configValue, category: c.category },
        }),
      ),
    );
    return ApiResponse.ok(saved);
  }
}
