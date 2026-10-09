import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly database: PrismaService) {}

  live() {
    return { status: 'ok' };
  }

  async ready() {
    if (!(await this.database.isReady()))
      throw new ServiceUnavailableException();
    return { status: 'ok' };
  }
}
