import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '.env.migrations', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DIRECT_URL },
});
