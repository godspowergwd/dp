import type { FastifyInstance } from 'fastify';
import { socialPublishingService } from '../../integrations/social/service.js';
import { advertisingProviders } from '../../integrations/advertising/types.js';

/**
 * Social & advertising integration routes — /api/v1/social
 * Users connect their own social accounts for publishing.
 * Tokens are encrypted server-side and never returned to the frontend.
 */
export async function socialRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];
  const uid = (r: any) => r.authUser!.id;

  // ---- Social accounts ----
  app.get('/accounts', { preHandler: auth }, async (request) => {
    const accounts = await socialPublishingService.getConnectedAccounts(uid(request));
    return { data: accounts };
  });

  app.get('/platforms', { preHandler: auth }, async () => {
    return {
      data: [
        { platform: 'facebook', name: 'Facebook', status: 'available' },
        { platform: 'instagram', name: 'Instagram', status: 'available' },
        { platform: 'tiktok', name: 'TikTok', status: 'available' },
        { platform: 'x', name: 'X (Twitter)', status: 'coming_soon' },
        { platform: 'linkedin', name: 'LinkedIn', status: 'coming_soon' },
        { platform: 'youtube', name: 'YouTube', status: 'coming_soon' },
        { platform: 'pinterest', name: 'Pinterest', status: 'coming_soon' },
      ],
    };
  });

  // Start OAuth (mock/placeholder until platform credentials configured)
  app.get('/oauth/:platform/url', { preHandler: auth }, async (request) => {
    const { platform } = request.params as { platform: string };
    const url = socialPublishingService.getOAuthUrl(uid(request), platform);
    return { data: { url, mode: 'demo' } };
  });

  // Complete connect (mock mode: any code works; real mode: exchange via provider)
  app.post('/connect', { preHandler: auth }, async (request, reply) => {
    const body = request.body as { platform: string; code?: string };
    if (!body?.platform) return reply.code(400).send({ error: 'platform is required' });
    try {
      const account = await socialPublishingService.connectAccount(uid(request), body.platform, body.code ?? 'demo-code');
      return { data: account };
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });

  app.post('/accounts/:id/disconnect', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await socialPublishingService.disconnectAccount(uid(request), id);
      return { data: { disconnected: true } };
    } catch {
      return reply.code(404).send({ error: 'Account not found' });
    }
  });

  // Reconnect (same as connect, refreshes stored token)
  app.post('/accounts/:id/reconnect', { preHandler: auth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { prisma } = await import('../../lib/prisma.js');
    const account = await prisma.socialAccount.findFirst({ where: { id, userId: uid(request) } });
    if (!account) return reply.code(404).send({ error: 'Account not found' });
    try {
      const reconnected = await socialPublishingService.connectAccount(uid(request), account.provider as string, 'demo-code');
      return { data: reconnected };
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });

  // ---- Advertising (COMING SOON placeholder) ----
  app.get('/advertising/accounts', { preHandler: auth }, async () => {
    return {
      data: Object.entries(advertisingProviders).map(([platform, provider]) => ({
        platform,
        name: provider.name,
        status: 'coming_soon',
      })),
      notice: 'Advertising integrations are coming soon. You will connect your own ad accounts; the platform will not handle ad billing.',
    };
  });
}

// helper no longer needed
void 0;