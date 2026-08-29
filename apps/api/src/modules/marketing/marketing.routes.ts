import type { FastifyInstance } from 'fastify';

/**
 * Marketing module routes — /api/v1/marketing (docs/02-FEATURE-MAP.md).
 * Social publishing pipeline: docs/12-SOCIAL-MEDIA-AUTOMATION.md
 */
export async function marketingRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/campaigns', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });
}
