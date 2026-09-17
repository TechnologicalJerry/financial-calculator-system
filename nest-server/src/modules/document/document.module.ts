import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { FileFolderController } from './file-folder.controller';

@Module({
  controllers: [DocumentController, FileFolderController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
