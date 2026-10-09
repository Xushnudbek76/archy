import { isolatedDatabaseUrl } from './database-connection';

describe('database test isolation', () => {
  const local =
    'postgresql://archy_runtime:fixture@127.0.0.1:55432/archy_test?schema=app';

  it('accepts only an explicit isolated local test database', () => {
    expect(isolatedDatabaseUrl(local, 'TEST_DATABASE_URL')).toBe(local);
  });

  it.each([
    local.replace('127.0.0.1', 'remote.example.com'),
    local.replace('/archy_test?', '/archy?'),
    `${local}&host=remote.example.com`,
    `${local}&database=postgres`,
  ])(
    'rejects remote or redirected test connections before opening a pool',
    (value) => {
      expect(() => isolatedDatabaseUrl(value, 'TEST_DATABASE_URL')).toThrow();
    },
  );
});
