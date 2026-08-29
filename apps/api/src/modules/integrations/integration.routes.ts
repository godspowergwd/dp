import type { FastifyInstance } from 'fastify';

/**
 * Integrations module routes — /api/v1/integrations.
 * Backs provider connections (stores, suppliers, AI, social) and status.
 * Credentials are always server-side (docs/13-SECURITY-PRIVACY.md).
 */
export async function integrationRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/connections', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });
}
