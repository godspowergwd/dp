import type { FastifyInstance } from 'fastify';

/**
 * Supplier module routes — /api/v1/suppliers (docs/02-FEATURE-MAP.md).
 * Supplier integration adapter contract: docs/10-SUPPLIER-INTEGRATIONS.md
 */
export async function supplierRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });
}
