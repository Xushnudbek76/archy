import { validateDatabaseUrl } from '../src/libs/config/environment';

export function isolatedDatabaseUrl(
  value: string | undefined,
  name: string,
): string {
  const connection = validateDatabaseUrl(value, name);
  const parsed = new URL(connection);
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) ||
    parsed.pathname !== '/archy_test'
  ) {
    throw new Error(
      'Database tests require the isolated local archy_test database',
    );
  }
  return connection;
}
