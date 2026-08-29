import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/auth.routes.js';
import { productRoutes } from './products/product.routes.js';
import { researchRoutes } from './research/research.routes.js';
import { supplierRoutes } from './suppliers/supplier.routes.js';
import { storeRoutes } from './stores/store.routes.js';
import { orderRoutes } from './orders/order.routes.js';
import { aiRoutes } from './ai/ai.routes.js';
import { marketingRoutes } from './marketing/marketing.routes.js';
import { analyticsRoutes } from './analytics/analytics.routes.js';
import { integrationRoutes } from './integrations/integration.routes.js';
import { auditRoutes } from './audit/audit.routes.js';

/**
 * Registers every domain module under the /api/v1 prefix
 * (docs/06-API-SPECIFICATION.md). Keeps the modular monolith organised.
 */
export async function registerModules(app: FastifyInstance): Promise<void> {
  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(productRoutes, { prefix: '/products' });
      await api.register(researchRoutes, { prefix: '/research' });
      await api.register(supplierRoutes, { prefix: '/suppliers' });
      await api.register(storeRoutes, { prefix: '/stores' });
      await api.register(orderRoutes, { prefix: '/orders' });
      await api.register(aiRoutes, { prefix: '/ai' });
      await api.register(marketingRoutes, { prefix: '/marketing' });
      await api.register(analyticsRoutes, { prefix: '/analytics' });
      await api.register(integrationRoutes, { prefix: '/integrations' });
      await api.register(auditRoutes, { prefix: '/audit' });
    },
    { prefix: '/api/v1' },
  );
}
