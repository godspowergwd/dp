import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { affiliateService } from '../../integrations/affiliate/service.js';
import { providerRegistry } from '../../integrations/affiliate/registry.js';
import { prisma } from '../../lib/prisma.js';

/** Admin-only guard (platform admins manage providers / syncs). */
export function requireAdmin(app: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(request, reply);
    const role = request.authUser?.role;
    if (role !== 'admin' && role !== 'owner') {
      return reply.code(403).send({ error: 'Admin access required' });
    }
  };
}

/**
 * Affiliate marketplace routes — /api/v1/affiliate
 * Products are synced from platform-controlled master affiliate accounts.
 * Individual users never connect affiliate accounts.
 */
export async function affiliateRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];

  // Ensure default provider records exist (mock/placeholder until real APIs configured)
  app.addHook('onReady', async () => {
    const infos = providerRegistry.getAll();
    for (const p of infos) {
      await prisma.affiliateProvider.upsert({
        where: { name: p.name },
        update: {},
        create: {
          name: p.name,
          type: p.type as never,
          status: p.status === 'configured' ? 'active' : 'active',
          supportedFeatures: p.supportedFeatures as never,
        },
      });
    }
  });

  // ---- Marketplace (user-facing) ----
  app.get('/products', { preHandler: auth }, async (request) => {
    const q = request.query as Record<string, string>;
    const products = await affiliateService.getProducts({
      search: q.search,
      provider: q.provider,
      category: q.category,
      minPrice: q.minPrice ? Number(q.minPrice) : undefined,
      maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
      sortBy: (q.sortBy as never) ?? 'popularity',
      sortOrder: (q.sortOrder as never) ?? 'desc',
      limit: q.limit ? Number(q.limit) : 50,
      offset: q.offset ? Number(q.offset) : 0,
    });
    // Serialise decimals + flag estimates
    const data = products.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      discount: p.discount ? Number(p.discount) : null,
      estimatedCommission: p.estimatedCommission ? Number(p.estimatedCommission) : null,
      commissionValue: p.commissionValue ? Number(p.commissionValue) : null,
      rating: p.rating ? Number(p.rating) : null,
      commissionIsEstimate: true,
      images: Array.isArray(p.images) ? p.images : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
    }));
    return { data, notice: 'Commission values are estimates until confirmed by the affiliate network.' };
  });

  app.get('/products/categories', { preHandler: auth }, async () => {
    const rows = await prisma.affiliateProduct.findMany({
      where: { status: 'active' },
      select: { category: true },
      distinct: ['category'],
    });
    return { data: rows.map((r) => r.category).filter(Boolean) };
  });

  app.get('/products/:id', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = await affiliateService.getProductById(id);
    if (!product) return reply.code(404).send({ error: 'Product not found' });
    return {
      data: {
        ...product,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        discount: product.discount ? Number(product.discount) : null,
        estimatedCommission: product.estimatedCommission ? Number(product.estimatedCommission) : null,
        commissionValue: product.commissionValue ? Number(product.commissionValue) : null,
        rating: product.rating ? Number(product.rating) : null,
        commissionIsEstimate: true,
        images: Array.isArray(product.images) ? product.images : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
      },
    };
  });

  // ---- Providers status (user-facing read) ----
  app.get('/providers', { preHandler: auth }, async () => {
    const dbProviders = await prisma.affiliateProvider.findMany({
      select: { name: true, type: true, status: true, syncStatus: true, lastSyncAt: true, supportedFeatures: true },
    });
    return {
      data: dbProviders.map((p) => ({
        ...p,
        mode: 'demo', // 'demo' until real credentials + adapters are configured; 'live' once real
        supportedFeatures: Array.isArray(p.supportedFeatures) ? p.supportedFeatures : [],
      })),
    };
  });

  // ---- Admin: trigger synchronisation ----
  app.post('/sync', { preHandler: [requireAdmin(app)] }, async (request, reply) => {
    const body = (request.body ?? {}) as { provider?: string };
    try {
      const results = body.provider
        ? { [body.provider]: await affiliateService.syncProducts(body.provider) }
        : await affiliateService.syncAllProviders();
      const adminId = request.authUser!.id;
      await prisma.auditLog.create({
        data: { actorId: adminId, action: 'affiliate.sync', entityType: 'AffiliateProvider', metadata: { results } as never },
      });
      return { data: results };
    } catch (e) {
      return reply.code(502).send({ error: `Sync failed: ${(e as Error).message}` });
    }
  });
}