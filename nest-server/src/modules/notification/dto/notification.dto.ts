import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @ApiPropertyOptional({ description: 'Target user ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Notification body message' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Notification category type', default: 'INFO' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Additional JSON metadata' })
  @IsString()
  @IsOptional()
  metadataJson?: string;
}
