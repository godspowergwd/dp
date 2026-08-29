import Fastify, { type FastifyInstance } from 'fastify';
import { registerPlugins } from './plugins/index.js';
import { registerModules } from './modules/index.js';
import { prisma } from './lib/prisma.js';
import { getConfig } from './config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    /** Lazily-resolved validated environment config. */
    config: ReturnType<typeof getConfig>;
  }
}

/** Build the Fastify application with plugins + routes. Used in tests too. */
export async function buildApp(overrides: object = {}): Promise<FastifyInstance> {
  const config = getConfig(overrides as never);

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          '*.password',
          '*.passwordHash',
          '*.token',
          '*.apiKey',
          '*.secret',
          '*.credentials',
        ],
        censor: '[REDACTED]',
      },
    },
    genReqId: (req) =>
      (req.headers['x-correlation-id'] as string) ?? crypto.randomUUID(),
    trustProxy: true,
  });

  app.decorate('config', config);

  await registerPlugins(app);

  // Health endpoint (docs/16-OBSERVABILITY-OPERATIONS.md)
  app.get('/health', async () => {
    let database = 'up';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    return { status: database === 'up' ? 'ok' : 'degraded', database };
  });

  // API version marker
  app.get('/api/v1', async () => ({
    name: 'private-dropshipping-os',
    version: 'v1',
  }));

  await registerModules(app);

  return app;
}
