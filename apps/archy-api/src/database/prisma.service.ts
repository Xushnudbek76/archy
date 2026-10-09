import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(databaseUrl: string) {
    const logger = new Logger(PrismaService.name);
    const adapter = new PrismaPg(
      {
        connectionString: databaseUrl,
        max: 5,
        connectionTimeoutMillis: 2000,
        query_timeout: 2000,
        statement_timeout: 2000,
        idleTimeoutMillis: 10000,
      },
      {
        schema: 'app',
        onPoolError: () => logger.warn({ event: 'database_pool_error' }),
      },
    );
    super({ adapter, log: [], errorFormat: 'minimal' });
  }

  async isReady(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT "id", "role" FROM "app"."User" LIMIT 0`;
      await this
        .$queryRaw`SELECT "id", "ownerId", "title", "archivedAt", "createdAt", "updatedAt" FROM "app"."Course" LIMIT 0`;
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
