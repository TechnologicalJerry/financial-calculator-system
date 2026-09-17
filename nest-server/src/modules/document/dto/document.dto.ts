import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Document file name' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  fileSize!: number;

  @ApiProperty({ description: 'MIME type e.g. application/pdf, image/png' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ description: 'Storage URL or file path' })
  @IsString()
  @IsNotEmpty()
  storageUrl!: string;

  @ApiPropertyOptional({ description: 'Folder UUID' })
  @IsUUID()
  @IsOptional()
  folderId?: string;
}

export class CreateFolderDto {
  @ApiProperty({ description: 'Folder display name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Parent folder UUID' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
