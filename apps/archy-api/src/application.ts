import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { Environment } from './libs/config/environment';
import { ApiExceptionFilter } from './libs/filters/api-exception.filter';

export function configureApplication(
  app: INestApplication,
  environment: Environment,
) {
  app.setGlobalPrefix('v1');
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('x-request-id', randomUUID());
    next();
  });
  app.enableCors({ origin: environment.webOrigin });
  app.useGlobalFilters(new ApiExceptionFilter());
}

export async function createApplication(environment: Environment) {
  const app = await NestFactory.create(AppModule, {
    logger: environment.nodeEnv === 'test' ? false : ['log', 'warn', 'error'],
  });
  configureApplication(app, environment);
  return app;
}
