import type { FastifyInstance } from 'fastify';

/**
 * Orders module routes — /api/v1/orders (docs/02-FEATURE-MAP.md).
 * Handles order import/sync, fulfillment status and tracking.
 */
export async function orderRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });
}
