import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('ready')
  ready() {
    return this.healthService.ready();
  }

  @Get('live')
  live() {
    return this.healthService.live();
  }
}
