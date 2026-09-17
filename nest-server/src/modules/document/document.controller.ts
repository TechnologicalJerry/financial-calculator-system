import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { CreateDocumentDto } from './dto/document.dto';

@ApiTags('Document Vault')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/documents')
export class DocumentController {
  constructor(
    @Inject(DocumentService) private readonly documentService: DocumentService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List user uploaded financial documents' })
  getDocuments(@CurrentUser('userId') userId: string) {
    return this.documentService.getDocuments(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Upload/register a document' })
  createDocument(@CurrentUser('userId') userId: string, @Body() dto: CreateDocumentDto) {
    return this.prisma.documentFile
      .create({
        data: {
          userId,
          fileName: dto.fileName,
          fileSize: dto.fileSize,
          mimeType: dto.mimeType,
          storageUrl: dto.storageUrl,
          folderId: dto.folderId,
        },
      })
      .then((d) => ApiResponse.ok(d));
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload document file' })
  uploadDocument(@CurrentUser('userId') userId: string, @Body() dto: CreateDocumentDto) {
    return this.createDocument(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details' })
  async getDocument(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    const document = await this.prisma.documentFile.findFirst({ where: { id, userId } });
    if (!document) throw new NotFoundException('Document not found');
    return ApiResponse.ok(document);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file payload' })
  async downloadDocument(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    const document = await this.prisma.documentFile.findFirst({ where: { id, userId } });
    if (!document) throw new NotFoundException('Document not found');
    return ApiResponse.ok({ downloadUrl: document.storageUrl, fileName: document.fileName, mimeType: document.mimeType });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document file' })
  async deleteDocument(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    const document = await this.prisma.documentFile.findFirst({ where: { id, userId } });
    if (!document) throw new NotFoundException('Document not found');
    await this.prisma.documentFile.delete({ where: { id } });
    return ApiResponse.ok(null, 'Document deleted');
  }
}
