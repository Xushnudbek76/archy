export interface Environment {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  host: string;
  webOrigin: string;
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

  return { nodeEnv: nodeEnv as Environment['nodeEnv'], port, host, webOrigin };
}
