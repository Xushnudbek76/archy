import { loadEnvironment } from './environment';

describe('API environment boundary', () => {
  it('uses local defaults without requiring credentials for unused services', () => {
    expect(
      loadEnvironment({
        DATABASE_URL:
          'postgresql://archy_runtime:test@127.0.0.1:5432/archy?schema=app',
      }),
    ).toEqual({
      nodeEnv: 'development',
      port: 3007,
      host: '127.0.0.1',
      webOrigin: 'http://localhost:3000',
      databaseUrl:
        'postgresql://archy_runtime:test@127.0.0.1:5432/archy?schema=app',
    });
  });

  it.each(['0', '-1', '65536', 'abc', '3007.5', ''])(
    'rejects invalid API_PORT %j',
    (port) => {
      expect(() =>
        loadEnvironment({
          DATABASE_URL:
            'postgresql://archy_runtime:test@127.0.0.1:5432/archy?schema=app',
          API_PORT: port,
        }),
      ).toThrow('API_PORT');
    },
  );

  it('accepts a valid configured port and host', () => {
    expect(
      loadEnvironment({
        DATABASE_URL:
          'postgresql://archy_runtime:test@127.0.0.1:5432/archy?schema=app',
        API_PORT: '4100',
        API_HOST: '0.0.0.0',
      }),
    ).toMatchObject({ port: 4100, host: '0.0.0.0' });
  });

  it('requires an explicit allowed browser origin in production', () => {
    expect(() =>
      loadEnvironment({
        DATABASE_URL:
          'postgresql://archy_runtime:test@127.0.0.1:5432/archy?schema=app',
        NODE_ENV: 'production',
      }),
    ).toThrow('WEB_ORIGIN');
  });

  it.each([
    'ftp://example.com',
    'https://example.com/path',
    'https://user:private-token@example.com',
    '*',
  ])('rejects a non-origin URL without leaking its value', (origin) => {
    try {
      loadEnvironment({
        DATABASE_URL:
          'postgresql://archy_runtime:test@127.0.0.1:5432/archy?schema=app',
        WEB_ORIGIN: origin,
      });
      throw new Error('Expected configuration rejection');
    } catch (error) {
      expect((error as Error).message).toBe(
        'Invalid configuration: WEB_ORIGIN',
      );
    }
  });

  it('rejects unknown runtime modes', () => {
    expect(() =>
      loadEnvironment({
        DATABASE_URL:
          'postgresql://archy_runtime:test@127.0.0.1:5432/archy?schema=app',
        NODE_ENV: 'prod',
      }),
    ).toThrow('NODE_ENV');
  });
});

describe('database configuration', () => {
  it('requires runtime credentials without requiring migration credentials', () => {
    expect(() => loadEnvironment({})).toThrow(
      'Invalid configuration: DATABASE_URL',
    );
    expect(
      loadEnvironment({
        DATABASE_URL:
          'postgresql://archy_runtime:test@127.0.0.1:5432/archy?schema=app',
      }),
    ).toHaveProperty('databaseUrl');
  });

  it.each([
    'https://private-user:private-password@db.example.com/archy?schema=app',
    'postgresql://private-user:private-password@db.example.com/archy?schema=public',
    'postgresql://private-user:private-password@db.example.com/archy?schema=app',
    'postgresql://private-user:private-password@db.example.com/archy?schema=app&sslmode=disable',
    'postgresql://private-user:private-password@db.example.com/?schema=app&sslmode=verify-full',
    'postgresql://private-user:private-password@db.example.com/archy?schema=app&sslmode=verify-full#secret',
    '',
  ])(
    'rejects unsafe or malformed database URLs without exposing credentials',
    (databaseUrl) => {
      expect(() => loadEnvironment({ DATABASE_URL: databaseUrl })).toThrow(
        'Invalid configuration: DATABASE_URL',
      );
    },
  );

  it('accepts a hosted connection with certificate verification', () => {
    const databaseUrl =
      'postgresql://archy_runtime:test@db.example.com:5432/postgres?schema=app&sslmode=verify-full';
    expect(loadEnvironment({ DATABASE_URL: databaseUrl })).toMatchObject({
      databaseUrl,
    });
  });

  it.each(['postgres', 'archy_migrator', 'archy_migrator.projectref'])(
    'rejects privileged database usernames at the API boundary',
    (username) => {
      expect(() =>
        loadEnvironment({
          DATABASE_URL: `postgresql://${username}:test@db.example.com/postgres?schema=app&sslmode=verify-full`,
        }),
      ).toThrow('Invalid configuration: DATABASE_URL');
    },
  );

  it('accepts the dedicated runtime role through the session pooler', () => {
    expect(
      loadEnvironment({
        DATABASE_URL:
          'postgresql://archy_runtime.projectref:test@db.example.com/postgres?schema=app&sslmode=verify-full',
      }),
    ).toHaveProperty('databaseUrl');
  });
});
