import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendChatMessageDto {
  @ApiProperty({ description: 'User message or query prompt' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Optional conversation ID to append message to' })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Optional system or contextual prompt' })
  @IsString()
  @IsOptional()
  prompt?: string;
}

export class GenerateInsightDto {
  @ApiPropertyOptional({ description: 'Insight domain category', default: 'FINANCIAL_HEALTH' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Severity level (INFO, WARNING, CRITICAL)', default: 'INFO' })
  @IsString()
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({ description: 'Additional contextual notes' })
  @IsString()
  @IsOptional()
  context?: string;
}
