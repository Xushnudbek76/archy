import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApplication } from '../src/application';
import { PrismaService } from '../src/database/prisma.service';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required for database tests');
const migrationUrl = process.env.TEST_MIGRATION_DATABASE_URL;
if (!migrationUrl) throw new Error('TEST_MIGRATION_DATABASE_URL is required');
for (const connection of [url, migrationUrl]) {
  const parsed = new URL(connection);
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) ||
    parsed.pathname !== '/archy_test'
  ) {
    throw new Error(
      'Database tests require the isolated local archy_test database',
    );
  }
}

describe('migrated application database', () => {
  const database = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 2000,
  });
  const migrations = new Pool({
    connectionString: migrationUrl,
    connectionTimeoutMillis: 2000,
  });
  let app: INestApplication;
  const ownerId = randomUUID();

  beforeAll(async () => {
    app = await createApplication({
      nodeEnv: 'test',
      port: 3007,
      host: '127.0.0.1',
      webOrigin: 'http://localhost:3000',
      databaseUrl: url,
    });
    await app.init();
    await database.query('INSERT INTO app."User" (id) VALUES ($1)', [ownerId]);
  });

  afterAll(async () => {
    await database
      .query('DELETE FROM app."Course" WHERE "ownerId" = $1', [ownerId])
      .catch(() => undefined);
    await database
      .query('DELETE FROM app."User" WHERE id = $1', [ownerId])
      .catch(() => undefined);
    await database.end();
    await migrations.end();
    await app.close();
  });

  it('reports ready only when both migrated application tables are queryable', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health/ready')
      .expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('persists an owned course and defaults new profiles to USER', async () => {
    const profile = await database.query(
      'SELECT role FROM app."User" WHERE id = $1',
      [ownerId],
    );
    expect(profile.rows[0].role).toBe('USER');
    const course = await database.query(
      'INSERT INTO app."Course" ("ownerId", title) VALUES ($1, $2) RETURNING id, title, "archivedAt"',
      [ownerId, 'Database systems'],
    );
    expect(course.rows[0]).toMatchObject({
      title: 'Database systems',
      archivedAt: null,
    });
    expect(course.rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects a course whose owner does not exist', async () => {
    await expect(
      database.query(
        'INSERT INTO app."Course" ("ownerId", title) VALUES ($1, $2)',
        [randomUUID(), 'Orphan course'],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('uses the generated Prisma client for course creation and updates', async () => {
    const prisma = app.get(PrismaService);
    const course = await prisma.course.create({
      data: { ownerId, title: 'Prisma course' },
    });
    const archivedAt = new Date();
    await prisma.course.update({
      where: { id: course.id },
      data: { archivedAt },
    });
    const stored = await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
    });
    expect(stored.archivedAt).toEqual(archivedAt);
    expect(stored.updatedAt.getTime()).toBeGreaterThanOrEqual(
      stored.createdAt.getTime(),
    );
  });

  it('prevents deleting an owner with existing courses', async () => {
    await database.query(
      'INSERT INTO app."Course" ("ownerId", title) VALUES ($1, $2)',
      [ownerId, 'Owner deletion fixture'],
    );
    await expect(
      database.query('DELETE FROM app."User" WHERE id = $1', [ownerId]),
    ).rejects.toMatchObject({ code: expect.stringMatching(/^23001$|^23503$/) });
  });

  it.each(['', '   ', ' padded ', '\ttab', 'newline\n', 'x'.repeat(101)])(
    'rejects invalid titles at the database boundary',
    async (title) => {
      await expect(
        database.query(
          'INSERT INTO app."Course" ("ownerId", title) VALUES ($1, $2)',
          [ownerId, title],
        ),
      ).rejects.toMatchObject({
        code: expect.stringMatching(/^23514$|^22001$/),
      });
    },
  );

  it('prevents runtime credentials from creating tables', async () => {
    await expect(
      database.query('CREATE TABLE app.unexpected_runtime_table (id integer)'),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('prevents runtime credentials from dropping application tables', async () => {
    await expect(
      database.query('DROP TABLE app."Course"'),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('keeps migration history inaccessible to the runtime role', async () => {
    await expect(
      database.query('SELECT * FROM app._prisma_migrations'),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('fails readiness for a missing table while liveness remains available, then recovers', async () => {
    await migrations.query(
      'ALTER TABLE app."Course" RENAME TO "Course_readiness_test"',
    );
    try {
      const unavailable = await request(app.getHttpServer())
        .get('/v1/health/ready')
        .expect(503);
      expect(unavailable.body.code).toBe('SERVICE_UNAVAILABLE');
      await request(app.getHttpServer()).get('/v1/health/live').expect(200);
    } finally {
      await migrations.query(
        'ALTER TABLE app."Course_readiness_test" RENAME TO "Course"',
      );
    }
    await request(app.getHttpServer()).get('/v1/health/ready').expect(200);
  });
});
