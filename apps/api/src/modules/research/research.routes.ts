import type { FastifyInstance } from 'fastify';

/**
 * Research Lab routes — /api/v1/research (docs/02-FEATURE-MAP.md).
 * TODO(phase 2): wire source capture, research jobs, scoring, decision log.
 * Product research spec: docs/09-PRODUCT-RESEARCH-SPEC.md
 */
export async function researchRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });
}
