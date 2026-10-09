import {
  Controller,
  ForbiddenException,
  Get,
  INestApplication,
  Module,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { configureApplication } from '../src/application';

@Controller('fixture')
class FailureFixtureController {
  @Get('unexpected')
  unexpected() {
    throw new Error('private-database-password');
  }

  @Get('forbidden')
  forbidden() {
    throw new ForbiddenException('private-resource-details');
  }
}

@Module({ controllers: [FailureFixtureController] })
class FailureFixtureModule {}

describe('API exception boundary', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(FailureFixtureModule, { logger: false });
    configureApplication(app, {
      nodeEnv: 'test',
      port: 3007,
      host: '127.0.0.1',
      webOrigin: 'http://localhost:3000',
      databaseUrl:
        'postgresql://archy_runtime:test@127.0.0.1:1/archy?schema=app',
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('hides unexpected exception details and preserves a generated request ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/fixture/unexpected')
      .set('X-Request-Id', 'caller-controlled-id')
      .expect(500);
    expect(response.body).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: response.headers['x-request-id'],
    });
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.text).not.toContain('private-database-password');
    expect(response.body).not.toHaveProperty('stack');
  });

  it('preserves authorization status without revealing internal resource details', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/fixture/forbidden')
      .expect(403);
    expect(response.body).toEqual({
      code: 'FORBIDDEN',
      message: 'Access denied',
      requestId: response.headers['x-request-id'],
    });
    expect(response.text).not.toContain('private-resource-details');
  });

  it('rejects oversized JSON as a client error instead of a server failure', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/fixture/unexpected')
      .send({ content: 'x'.repeat(110 * 1024) })
      .expect(413);
    expect(response.body).toEqual({
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request payload is too large',
      requestId: response.headers['x-request-id'],
    });
  });

  it('rejects unsupported JSON charsets as a client error without leaking parser details', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/fixture/unexpected')
      .set('Content-Type', 'application/json; charset=iso-8859-1')
      .send('{"value":1}')
      .expect(415);
    expect(response.body).toEqual({
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Unsupported request format',
      requestId: response.headers['x-request-id'],
    });
  });
});
