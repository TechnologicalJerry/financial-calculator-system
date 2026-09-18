import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioCompatController } from './portfolio-compat.controller';

@Module({
  controllers: [PortfolioController, PortfolioCompatController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
