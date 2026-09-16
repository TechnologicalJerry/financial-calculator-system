import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'User account status e.g. ACTIVE, SUSPENDED, LOCKED' })
  @IsString()
  @IsNotEmpty()
  status!: string;
}

export class CreateTaxRuleDto {
  @ApiProperty({ description: 'ISO 2-letter country code' })
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @ApiProperty({ description: 'Tax type e.g. INCOME_TAX, CAPITAL_GAINS' })
  @IsString()
  @IsNotEmpty()
  taxType!: string;

  @ApiProperty({ description: 'JSON string of tax bracket configurations' })
  @IsString()
  @IsNotEmpty()
  taxBracketsJson!: string;

  @ApiProperty({ description: 'Effective tax year' })
  @IsNumber()
  effectiveYear!: number;
}

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name e.g. ROLE_ANALYST' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this role is a system role' })
  @IsBoolean()
  @IsOptional()
  isSystemRole?: boolean;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ description: 'List of permission UUIDs' })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}

export class CreateFormulaDto {
  @ApiProperty({ description: 'Calculator UUID' })
  @IsUUID()
  @IsNotEmpty()
  calculatorId!: string;

  @ApiProperty({ description: 'Formula code identifier' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'Formula template name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Mathematical expression template' })
  @IsString()
  @IsNotEmpty()
  expression!: string;
}

export class CreateFeatureFlagDto {
  @ApiProperty({ description: 'Feature flag unique key' })
  @IsString()
  @IsNotEmpty()
  keyName!: string;

  @ApiPropertyOptional({ description: 'Initial state' })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Rollout percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;

  @ApiPropertyOptional({ description: 'Target roles comma-separated' })
  @IsString()
  @IsOptional()
  targetRoles?: string;
}

export class ToggleFeatureFlagDto {
  @ApiProperty({ description: 'New state for feature flag' })
  @IsBoolean()
  isEnabled!: boolean;
}

export class CreateApprovalDto {
  @ApiProperty({ description: 'Target entity type' })
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiProperty({ description: 'Target entity UUID' })
  @IsUUID()
  @IsNotEmpty()
  entityId!: string;

  @ApiProperty({ description: 'Requester user UUID' })
  @IsUUID()
  @IsNotEmpty()
  requestedBy!: string;
}

export class ConfigItemDto {
  @ApiProperty({ description: 'Configuration key' })
  @IsString()
  @IsNotEmpty()
  configKey!: string;

  @ApiProperty({ description: 'Configuration value' })
  @IsString()
  @IsNotEmpty()
  configValue!: string;

  @ApiPropertyOptional({ description: 'Category grouping' })
  @IsString()
  @IsOptional()
  category?: string;
}

export class UpsertConfigsDto {
  @ApiProperty({ type: [ConfigItemDto], description: 'List of configs to update or insert' })
  @IsArray()
  configs!: ConfigItemDto[];
}
