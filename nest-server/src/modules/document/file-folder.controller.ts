import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { CreateDocumentDto, CreateFolderDto } from './dto/document.dto';

@ApiTags('Document Vault')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class FileFolderController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('folders')
  @ApiOperation({ summary: 'Create folder' })
  createFolder(@CurrentUser('userId') userId: string, @Body() dto: CreateFolderDto) {
    return this.prisma.documentFolder
      .create({ data: { userId, name: dto.name, parentId: dto.parentId } })
      .then((d) => ApiResponse.ok(d));
  }

  @Get('folders')
  @ApiOperation({ summary: 'List user folders' })
  folders(@CurrentUser('userId') userId: string) {
    return this.prisma.documentFolder.findMany({ where: { userId } }).then((d) => ApiResponse.ok(d));
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete folder' })
  async deleteFolder(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    await this.prisma.documentFolder.deleteMany({ where: { id, userId } });
    return ApiResponse.ok(null, 'Folder deleted');
  }

  @Post('files/upload')
  @ApiOperation({ summary: 'Upload file' })
  upload(@CurrentUser('userId') userId: string, @Body() dto: CreateDocumentDto) {
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

  @Get('files')
  @ApiOperation({ summary: 'List user files' })
  files(@CurrentUser('userId') userId: string) {
    return this.prisma.documentFile.findMany({ where: { userId } }).then((d) => ApiResponse.ok(d));
  }
}
