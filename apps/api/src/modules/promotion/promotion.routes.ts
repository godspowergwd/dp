import type { FastifyInstance } from 'fastify';
import { promotionService } from '../../integrations/promotion-service.js';
import { socialPublishingService } from '../../integrations/social/service.js';

/**
 * Promotion workflow routes — /api/v1/promotions
 * Product → Promote → AI content → social account → publish.
 */
export async function promotionRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];
  const uid = (r: any) => r.authUser!.id;

  // Promote a product (creates draft promotion with unique tracking reference)
  app.post('/', { preHandler: auth }, async (request, reply) => {
    const body = request.body as { productId: string; socialPlatform?: string; socialAccountId?: string };
    if (!body?.productId) return reply.code(400).send({ error: 'productId is required' });
    try {
      const promotion = await promotionService.createPromotion(uid(request), body.productId, {
        socialPlatform: body.socialPlatform,
        socialAccountId: body.socialAccountId,
      });
      return { data: promotion };
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });

  app.get('/', { preHandler: auth }, async (request) => {
    const q = request.query as Record<string, string>;
    const promotions = await promotionService.getUserPromotions(uid(request), {
      status: q.status,
      limit: q.limit ? Number(q.limit) : 50,
      offset: q.offset ? Number(q.offset) : 0,
    });
    const data = promotions.map((p: any) => ({
      ...p,
      estimatedEarnings: Number(p.estimatedEarnings),
      confirmedEarnings: Number(p.confirmedEarnings),
    }));
    return { data };
  });

  app.get('/:id', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const promotion = await promotionService.getPromotionById(id, uid(request));
    if (!promotion) return reply.code(404).send({ error: 'Promotion not found' });
    return { data: promotion };
  });

  app.patch('/:id', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    try {
      const promotion = await promotionService.updatePromotion(id, uid(request), body);
      return { data: promotion };
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });

  app.delete('/:id', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await promotionService.deletePromotion(id, uid(request));
      return { data: { deleted: true } };
    } catch {
      return reply.code(404).send({ error: 'Promotion not found' });
    }
  });

  // AI content generation for the promotion's product (placeholder/mock until real AI configured)
  app.post('/:id/content', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as {
      contentType?: string; tone?: string; audience?: string; goal?: string; length?: string;
    };
    const promotion = await promotionService.getPromotionById(id, uid(request));
    if (!promotion) return reply.code(404).send({ error: 'Promotion not found' });
    try {
      const result = await promotionService.getAIContent(promotion.productId);
      const chosen = body.contentType
        ? result.suggestions.find((s: any) => s.type === body.contentType) ?? result.suggestions[0]
        : result.suggestions[0];
      const generatedContent = {
        type: chosen.type,
        text: chosen.content,
        hashtags: chosen.hashtags ?? [],
        affiliateLink: promotion.affiliateLink,
        options: { tone: body.tone ?? 'friendly', audience: body.audience ?? 'general', goal: body.goal ?? 'sales' },
      };
      await promotionService.updatePromotion(id, uid(request), { generatedContent, status: 'ready' });
      return { data: { generatedContent, alternatives: result.suggestions } };
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });

  // Publish to the selected connected social account
  app.post('/:id/publish', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { socialAccountId?: string };
    const promotion = await promotionService.getPromotionById(id, uid(request));
    if (!promotion) return reply.code(404).send({ error: 'Promotion not found' });

    if (body.socialAccountId) {
      const accounts = await socialPublishingService.getConnectedAccounts(uid(request));
      const account = accounts.find((a) => a.id === body.socialAccountId && a.status === 'connected');
      if (!account) return reply.code(400).send({ error: 'Selected social account is not connected' });
      await promotionService.updatePromotion(id, uid(request), {
        socialAccountId: account.id,
        socialPlatform: account.provider,
      });
    }

    const fresh = await promotionService.getPromotionById(id, uid(request));
    if (!fresh?.socialPlatform) return reply.code(400).send({ error: 'Select a social platform first' });
    if (!fresh.generatedContent) return reply.code(400).send({ error: 'Generate content before publishing' });

    const content = {
      text: fresh.generatedContent.text,
      hashtags: fresh.generatedContent.hashtags ?? [],
      link: fresh.affiliateLink,
      imageUrl: Array.isArray(fresh.product?.images) && fresh.product.images.length
        ? fresh.product.images[0] : undefined,
    };

    try {
      const result = await socialPublishingService.publishPost(uid(request), id, content);
      if (!result.success) {
        await promotionService.updatePromotion(id, uid(request), { status: 'failed' });
        return reply.code(502).send({ error: result.error ?? 'Publishing failed' });
      }
      const updated = await promotionService.getPromotionById(id, uid(request));
      return { data: updated, publishResult: result };
    } catch (e) {
      await promotionService.updatePromotion(id, uid(request), { status: 'failed' });
      return reply.code(502).send({ error: (e as Error).message });
    }
  });

  // Commission simulation — clearly marked DEMO; only creates PENDING (unconfirmed) earnings
  app.post('/:id/simulate-sale', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const promotion = await promotionService.getPromotionById(id, uid(request));
    if (!promotion) return reply.code(404).send({ error: 'Promotion not found' });
    const saleAmount = Number(promotion.product.price);
    const commissionAmount = Number(promotion.product.estimatedCommission ?? 0);
    if (commissionAmount <= 0) return reply.code(400).send({ error: 'No estimated commission configured for this product' });

    const { prisma } = await import('../../lib/prisma.js');
    const providerRecord = await prisma.affiliateProvider.findFirst({
      where: { name: promotion.affiliateProvider },
    });
    if (!providerRecord) return reply.code(400).send({ error: 'Affiliate provider not configured' });

    const commission = await prisma.commission.create({
      data: {
        userId: uid(request), promotionId: id, productId: promotion.productId,
        affiliateProviderId: providerRecord.id,
        providerTransactionId: `demo-${Date.now()}`,
        saleAmount, commissionAmount, platformShare: 0, userShare: commissionAmount,
        currency: promotion.product.currency ?? 'USD',
        status: 'pending',
        detectedAt: new Date(),
      },
    });
    await prisma.walletTransaction.create({
      data: {
        userId: uid(request), type: 'commission_pending', amount: commissionAmount,
        currency: commission.currency, status: 'pending', reference: commission.id,
        description: '[DEMO] Commission detected (pending attribution confirmation)',
        relatedCommissionId: commission.id,
      },
    });
    await prisma.promotion.update({
      where: { id }, data: { conversions: { increment: 1 }, estimatedEarnings: { increment: commissionAmount } },
    });
    return {
      data: commission,
      notice: 'DEMO sale recorded as PENDING. Earnings only become AVAILABLE after admin confirmation — never automatically.',
    };
  });
}