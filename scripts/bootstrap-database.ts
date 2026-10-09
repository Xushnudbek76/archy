import { config } from 'dotenv';
import { Client } from 'pg';
import { validateDatabaseUrl } from '../apps/archy-api/src/libs/config/environment';

config({ path: '.env.bootstrap', quiet: true });

async function bootstrap() {
  const connectionString = validateDatabaseUrl(
    process.env.BOOTSTRAP_DATABASE_URL,
    'BOOTSTRAP_DATABASE_URL',
  );
  const migrationPassword = process.env.MIGRATION_DATABASE_PASSWORD;
  const runtimePassword = process.env.RUNTIME_DATABASE_PASSWORD;
  if (
    !migrationPassword ||
    !runtimePassword ||
    migrationPassword.length < 24 ||
    runtimePassword.length < 24 ||
    migrationPassword === runtimePassword
  )
    throw new Error(
      'Use distinct database passwords of at least 24 characters',
    );

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    statement_timeout: 5000,
  });
  try {
    await client.connect();
    await client.query('BEGIN');
    const existing = await client.query(`
      SELECT 1 FROM pg_namespace WHERE nspname = 'app'
      UNION ALL SELECT 1 FROM pg_roles WHERE rolname IN ('archy_migrator', 'archy_runtime')
    `);
    if (existing.rowCount)
      throw new Error(
        'Bootstrap requires a new database and unused application roles',
      );
    for (const [role, password] of [
      ['archy_migrator', migrationPassword],
      ['archy_runtime', runtimePassword],
    ]) {
      // PostgreSQL role DDL cannot bind parameters; let PostgreSQL quote the value.
      const literal = await client.query<{ password: string }>(
        'SELECT quote_literal($1) AS password',
        [password],
      );
      await client.query(
        `CREATE ROLE ${role} LOGIN PASSWORD ${literal.rows[0]!.password} NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
      );
    }
    const admin = await client.query<{ name: string }>(
      'SELECT quote_ident(current_user) AS name',
    );
    await client.query(`GRANT archy_migrator TO ${admin.rows[0]!.name}`);
    await client.query('CREATE SCHEMA app AUTHORIZATION archy_migrator');
    await client.query('REVOKE ALL ON SCHEMA app FROM PUBLIC');
    await client.query('GRANT USAGE ON SCHEMA app TO archy_runtime');
    await client.query('COMMIT');
    console.log(
      'Private application schema and separate database roles created. Apply Prisma migrations next.',
    );
  } catch {
    await client.query('ROLLBACK').catch(() => undefined);
    // Provider exceptions may contain connection details or role/password SQL.
    throw new Error(
      'Database bootstrap failed. Check the connection and use a new dedicated database; existing roles are never replaced.',
    );
  } finally {
    await client.end();
  }
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  console.error(
    message.startsWith('Invalid configuration:') ||
      message.startsWith('Use distinct database passwords')
      ? message
      : 'Database bootstrap failed. Check the connection and use a new dedicated database; existing roles are never replaced.',
  );
  process.exitCode = 1;
});
