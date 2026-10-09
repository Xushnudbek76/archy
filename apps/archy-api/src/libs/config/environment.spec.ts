import { loadEnvironment } from './environment';

describe('API environment boundary', () => {
  it('uses local defaults without requiring credentials for unused services', () => {
    expect(loadEnvironment({})).toEqual({
      nodeEnv: 'development',
      port: 3007,
      host: '127.0.0.1',
      webOrigin: 'http://localhost:3000',
    });
  });

  it.each(['0', '-1', '65536', 'abc', '3007.5', ''])(
    'rejects invalid API_PORT %j',
    (port) => {
      expect(() => loadEnvironment({ API_PORT: port })).toThrow('API_PORT');
    },
  );

  it('accepts a valid configured port and host', () => {
    expect(
      loadEnvironment({ API_PORT: '4100', API_HOST: '0.0.0.0' }),
    ).toMatchObject({ port: 4100, host: '0.0.0.0' });
  });

  it('requires an explicit allowed browser origin in production', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'production' })).toThrow(
      'WEB_ORIGIN',
    );
  });

  it.each([
    'ftp://example.com',
    'https://example.com/path',
    'https://user:private-token@example.com',
    '*',
  ])('rejects a non-origin URL without leaking its value', (origin) => {
    try {
      loadEnvironment({ WEB_ORIGIN: origin });
      throw new Error('Expected configuration rejection');
    } catch (error) {
      expect((error as Error).message).toBe(
        'Invalid configuration: WEB_ORIGIN',
      );
    }
  });

  it('rejects unknown runtime modes', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'prod' })).toThrow('NODE_ENV');
  });
});
