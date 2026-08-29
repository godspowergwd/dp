import type { FastifyInstance } from 'fastify';

/**
 * Stores module routes — /api/v1/stores (docs/02-FEATURE-MAP.md).
 * Storefront integration spec: docs/11-STOREFRONT-INTEGRATIONS.md
 */
export async function storeRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });
}
