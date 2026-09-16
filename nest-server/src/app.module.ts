import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CalculatorModule } from './modules/calculator/calculator.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DocumentModule } from './modules/document/document.module';
import { SearchModule } from './modules/search/search.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UserModule,
    CalculatorModule,
    PortfolioModule,
    AnalyticsModule,
    DocumentModule,
    SearchModule,
    AiModule,
    NotificationModule,
    AdminModule,
  ],
})
export class AppModule {}
