import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Connected to PostgreSQL Database via Prisma');
    } catch {
      console.warn('⚠️ Could not connect to PostgreSQL database on startup. Verify DATABASE_URL in nest-server/.env.');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // Ignore disconnect errors during module shutdown
    }
  }
}
