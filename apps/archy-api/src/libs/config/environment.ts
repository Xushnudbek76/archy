export interface Environment {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  host: string;
  webOrigin: string;
  databaseUrl: string;
}

export function loadEnvironment(env: NodeJS.ProcessEnv): Environment {
  const invalid = (name: string): never => {
    throw new Error(`Invalid configuration: ${name}`);
  };
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (
    nodeEnv !== 'development' &&
    nodeEnv !== 'test' &&
    nodeEnv !== 'production'
  )
    invalid('NODE_ENV');

  const rawPort = env.API_PORT ?? '3007';
  const port = Number(rawPort);
  if (
    !/^\d+$/.test(rawPort) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  )
    invalid('API_PORT');

  const host = env.API_HOST ?? '127.0.0.1';
  if (!host || /[\s/@?#]/.test(host)) invalid('API_HOST');

  if (nodeEnv === 'production' && !env.WEB_ORIGIN) invalid('WEB_ORIGIN');
  const rawOrigin = env.WEB_ORIGIN ?? 'http://localhost:3000';
  let webOrigin: string;
  try {
    const url = new URL(rawOrigin);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      invalid('WEB_ORIGIN');
    webOrigin = url.origin;
  } catch {
    return invalid('WEB_ORIGIN');
  }

  const databaseUrl = validateDatabaseUrl(env.DATABASE_URL);
  try {
    const username = decodeURIComponent(new URL(databaseUrl).username);
    if (!/^archy_runtime(?:\.[a-z0-9]+)?$/.test(username))
      invalid('DATABASE_URL');
  } catch {
    return invalid('DATABASE_URL');
  }
  return {
    nodeEnv: nodeEnv as Environment['nodeEnv'],
    port,
    host,
    webOrigin,
    databaseUrl,
  };
}

export function validateDatabaseUrl(
  value: string | undefined,
  name = 'DATABASE_URL',
): string {
  const invalid = (): never => {
    throw new Error(`Invalid configuration: ${name}`);
  };
  if (!value) return invalid();
  try {
    const url = new URL(value);
    // pg merges connection-string query options over authority and pool settings.
    // Only schema selection and verified TLS configuration are configurable here.
    const allowedParameters = new Set(['schema', 'sslmode', 'sslrootcert']);
    for (const key of url.searchParams.keys()) {
      if (
        !allowedParameters.has(key) ||
        url.searchParams.getAll(key).length !== 1
      )
        return invalid();
    }
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname ||
      !url.username ||
      !url.password ||
      url.pathname.length < 2 ||
      url.hash ||
      url.searchParams.getAll('schema').length !== 1 ||
      url.searchParams.get('schema') !== 'app' ||
      (!local &&
        (url.searchParams.getAll('sslmode').length !== 1 ||
          url.searchParams.get('sslmode') !== 'verify-full'))
    )
      return invalid();
    return value;
  } catch {
    return invalid();
  }
}
