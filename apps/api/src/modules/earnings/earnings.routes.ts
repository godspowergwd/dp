import type { FastifyInstance } from 'fastify';
import { earningsService } from '../../integrations/earnings-service.js';

/**
 * Earnings & wallet routes — /api/v1/earnings
 * Balances: estimated / pending / available / paid. Decimal-safe (Prisma Decimal).
 */
export async function earningsRoutes(app: FastifyInstance): Promise<void> {
  const auth = [app.authenticate];
  const uid = (r: any) => r.authUser!.id;

  app.get('/wallet', { preHandler: auth }, async (request) => {
    const balance = await earningsService.getWalletBalance(uid(request));
    return {
      data: {
        ...balance,
        note: {
          estimated: 'Potential earnings from known product commission data',
          pending: 'Sales detected but not yet confirmed by the affiliate network',
          available: 'Confirmed earnings approved for payout',
          paid: 'Earnings already paid to you',
        },
      },
    };
  });

  app.get('/commissions', { preHandler: auth }, async (request) => {
    const q = request.query as Record<string, string>;
    const commissions = await earningsService.getCommissionHistory(uid(request), {
      status: q.status,
      limit: q.limit ? Number(q.limit) : 50,
      offset: q.offset ? Number(q.offset) : 0,
    });
    const data = commissions.map((c: any) => ({
      ...c,
      saleAmount: Number(c.saleAmount),
      commissionAmount: Number(c.commissionAmount),
      platformShare: Number(c.platformShare),
      userShare: Number(c.userShare),
    }));
    return { data };
  });

  app.get('/transactions', { preHandler: auth }, async (request) => {
    const q = request.query as Record<string, string>;
    const { prisma } = await import('../../lib/prisma.js');
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: uid(request) },
      orderBy: { createdAt: 'desc' },
      take: q.limit ? Number(q.limit) : 50,
      skip: q.offset ? Number(q.offset) : 0,
    });
    const data = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));
    return { data };
  });

  app.get('/withdrawals', { preHandler: auth }, async (request) => {
    const withdrawals = await earningsService.getWithdrawalHistory(uid(request));
    const data = withdrawals.map((w: any) => ({ ...w, amount: Number(w.amount) }));
    return { data };
  });

  // Request a withdrawal — reserved from AVAILABLE balance only
  app.post('/withdrawals', { preHandler: auth }, async (request, reply) => {
    const body = request.body as { amount: number; payoutMethod: string; payoutDetails: Record<string, string> };
    if (!body?.amount || body.amount <= 0) return reply.code(400).send({ error: 'Invalid withdrawal amount' });
    if (!body?.payoutMethod) return reply.code(400).send({ error: 'Payout method is required' });
    if (!body?.payoutDetails || Object.keys(body.payoutDetails).length === 0) {
      return reply.code(400).send({ error: 'Payout details are required' });
    }
    // Duplicate-withdrawal protection: reject if there is already an active request
    const { prisma } = await import('../../lib/prisma.js');
    const active = await prisma.withdrawalRequest.findFirst({
      where: { userId: uid(request), status: { in: ['pending', 'approved', 'processing'] } },
    });
    if (active) return reply.code(409).send({ error: 'You already have a withdrawal request being processed' });

    try {
      const withdrawal = await earningsService.requestWithdrawal(uid(request), body.amount, body.payoutMethod, body.payoutDetails);
      return { data: withdrawal };
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });
}