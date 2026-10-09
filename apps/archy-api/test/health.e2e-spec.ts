import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApplication } from '../src/application';

describe('public API boundary', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApplication({
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

  it('serves liveness under the versioned API prefix', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health/live')
      .expect(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('reports unavailable database readiness without affecting liveness', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health/ready')
      .expect(503);
    expect(response.body).toEqual({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
      requestId: response.headers['x-request-id'],
    });
    expect(response.text).not.toContain('archy_runtime');
    await request(app.getHttpServer()).get('/v1/health/live').expect(200);
  });

  it('returns a stable error envelope correlated with the response header', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/missing')
      .expect(404);
    expect(response.body).toEqual({
      code: 'NOT_FOUND',
      message: 'Resource not found',
      requestId: response.headers['x-request-id'],
    });
  });

  it('allows the configured browser origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health/live')
      .set('Origin', 'http://localhost:3000')
      .expect(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });

  it('does not grant CORS access to an unrelated origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health/live')
      .set('Origin', 'https://unrelated.example')
      .expect(200);
    expect(response.headers['access-control-allow-origin']).not.toBe(
      'https://unrelated.example',
    );
  });
});
