import type { FastifyInstance } from 'fastify';

/**
 * Register all cross-cutting Fastify plugins (security, CORS, rate limiting,
 * error handling). Extend this list as security needs grow.
 */
export async function registerPlugins(app: FastifyInstance): Promise<void> {
  // Helmet: sensible security headers
  await app.register(import('@fastify/helmet'), { global: true });

  // CORS: restrict to our own frontend in production
  await app.register(import('@fastify/cors'), {
    origin: process.env.NODE_ENV === 'production' ? process.env.APP_URL : true,
    credentials: true,
  });

  // JWT for authentication
  await app.register(import('@fastify/jwt'), {
    secret: app.config.AUTH_SECRET,
    sign: { expiresIn: app.config.AUTH_TOKEN_TTL },
  });

  // Rate limiting (docs/13-SECURITY-PRIVACY.md)
  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  // Standardised HTTP errors (NotFound etc.)
  await app.register(import('@fastify/sensible'));

  // Our auth plugin (decorates `authenticate` preHandler)
  const { authPlugin } = await import('./auth.js');
  await app.register(authPlugin);

  // Our custom error handler (registered last so it wraps error propagation)
  const { errorHandlerPlugin } = await import('./error-handler.js');
  await app.register(errorHandlerPlugin);
}

