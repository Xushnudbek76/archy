import 'reflect-metadata';
import 'dotenv/config';
import { createApplication } from './application';
import { loadEnvironment } from './libs/config/environment';

async function bootstrap() {
  const environment = loadEnvironment(process.env);
  const app = await createApplication(environment);
  app.enableShutdownHooks();
  await app.listen(environment.port, environment.host);
}

void bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error && error.message.startsWith('Invalid configuration:')
      ? error.message
      : 'API startup failed';
  console.error(message);
  process.exitCode = 1;
});
