import type { FastifyInstance } from 'fastify';

/**
 * Analytics module routes — /api/v1/analytics (docs/02-FEATURE-MAP.md).
 * Profitability, product performance, marketing performance, operating costs.
 */
export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/dashboard', { preHandler: auth }, async () => {
    // TODO(phase 5/6): compute KPIs from aggregated tables
    return { data: {} };
  });
}
