import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiCompatController } from './ai-compat.controller';

@Module({
  controllers: [AiController, AiCompatController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
