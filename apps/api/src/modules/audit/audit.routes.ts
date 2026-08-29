import type { FastifyInstance } from 'fastify';

/**
 * Audit module routes — /api/v1/audit.
 * Read-only view into audit_logs (docs/13-SECURITY-PRIVACY.md).
 */
export async function auditRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  app.get('/logs', { preHandler: auth }, async () => {
    return { data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } };
  });
}
