import type { FastifyInstance } from 'fastify';

/**
 * AI module routes — /api/v1/ai (docs/02-FEATURE-MAP.md).
 * AI job flow per docs/06-API-SPECIFICATION.md:
 *   POST /jobs  -> create a job
 *   GET  /jobs/:id -> status + results
 * AI architecture: docs/07-AI-ARCHITECTURE.md
 */
export async function aiRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/jobs', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });

  app.get('/jobs/:id', { preHandler: auth }, async (_request) => {
    // TODO(phase 2): return AI job status + results by id
    return { data: null };
  });
}
