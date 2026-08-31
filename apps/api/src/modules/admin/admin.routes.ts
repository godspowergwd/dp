import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { earningsService } from '../../integrations/earnings-service.js';
import { requireAdmin } from '../affiliate/affiliate.routes.js';

/**
 * Admin routes — /api/v1/admin
 * Affiliate provider management, commission confirmation, withdrawal processing,
 * user management, audit logs. All endpoints require admin role.
 */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const admin = [requireAdmin(app)];

  app.get('/dashboard', { preHandler: admin }, async () => {
    const [users, products, promotions, commissions, withdrawals] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.affiliateProduct.count(),
      prisma.promotion.count(),
      prisma.commission.findMany({ select: { status: true, userShare: true } }),
      prisma.withdrawalRequest.findMany({ select: { status: true, amount: true } }),
    ]);
    const commissionsByStatus: Record<string, { count: number; total: number }> = {};
    for (const c of commissions) {
      const s = commissionsByStatus[c.status] ?? { count: 0, total: 0 };
      s.count++; s.total += Number(c.userShare);
      commissionsByStatus[c.status] = s;
    }
    const withdrawalsByStatus: Record<string, { count: number; total: number }> = {};
    for (const w of withdrawals) {
      const s = withdrawalsByStatus[w.status] ?? { count: 0, total: 0 };
      s.count++; s.total += Number(w.amount);
      withdrawalsByStatus[w.status] = s;
    }
    return {
      data: {
        users, products, promotions,
        commissions: commissionsByStatus,
        withdrawals: withdrawalsByStatus,
      },
    };
  });

  // ---- Users ----
  app.get('/users', { preHandler: admin }, async () => {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data: users };
  });

  app.patch('/users/:id/status', { preHandler: admin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { isActive: boolean };
    if (typeof body?.isActive !== 'boolean') return reply.code(400).send({ error: 'isActive boolean required' });
    const before = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
    if (!before) return reply.code(404).send({ error: 'User not found' });
    const user = await prisma.user.update({ where: { id }, data: { isActive: body.isActive } });
    await prisma.auditLog.create({
      data: {
        actorId: request.authUser!.id, action: 'admin.user.status_change', entityType: 'User', entityId: id,
        before: { isActive: before.isActive } as never, after: { isActive: body.isActive } as never,
      },
    });
    return { data: { id: user.id, isActive: user.isActive } };
  });

  // ---- Commissions management ----
  app.get('/commissions', { preHandler: admin }, async (request) => {
    const q = request.query as Record<string, string>;
    const rows = await prisma.commission.findMany({
      where: q.status ? { status: q.status as never } : {},
      orderBy: { createdAt: 'desc' }, take: 100,
      include: {
        user: { select: { email: true, name: true } },
        promotion: { select: { trackingReference: true } },
        product: { select: { title: true } },
        provider: { select: { name: true } },
      },
    });
    const data = rows.map((c) => ({
      ...c, saleAmount: Number(c.saleAmount), commissionAmount: Number(c.commissionAmount),
      platformShare: Number(c.platformShare), userShare: Number(c.userShare),
    }));
    return { data };
  });

  // Confirm commission → moves into AVAILABLE balance
  app.post('/commissions/:id/confirm', { preHandler: admin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const before = await prisma.commission.findUnique({ where: { id }, select: { status: true } });
      await earningsService.approveCommission(id);
      await prisma.auditLog.create({
        data: {
          actorId: request.authUser!.id, action: 'admin.commission.confirm', entityType: 'Commission', entityId: id,
          before: { status: before?.status } as never, after: { status: 'confirmed' } as never,
        },
      });
      return { data: { id, status: 'confirmed' } };
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
  });

  app.post('/commissions/:id/reject', { preHandler: admin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { reason?: string };
    const before = await prisma.commission.findUnique({ where: { id }, select: { status: true } });
    if (!before) return reply.code(404).send({ error: 'Commission not found' });
    const commission = await prisma.commission.update({
      where: { id }, data: { status: 'rejected' },
    });
    await prisma.walletTransaction.updateMany({
      where: { relatedCommissionId: id, type: { in: ['commission_pending', 'commission_confirmed'] } },
      data: { status: 'reversed' },
    });
    await prisma.auditLog.create({
      data: {
        actorId: request.authUser!.id, action: 'admin.commission.reject', entityType: 'Commission', entityId: id,
        before: { status: before.status } as never, after: { status: 'rejected' } as never,
        metadata: { reason: body.reason } as never,
      },
    });
    return { data: { id: commission.id, status: commission.status } };
  });

  // ---- Withdrawals management ----
  app.get('/withdrawals', { preHandler: admin }, async (request) => {
    const q = request.query as Record<string, string>;
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: q.status ? { status: q.status as never } : {},
      orderBy: { createdAt: 'desc' }, take: 100,
      include: { user: { select: { email: true, name: true } } },
    });
    const data = withdrawals.map((w) => ({ ...w, amount: Number(w.amount) }));
    return { data };
  });

  app.post('/withdrawals/:id/review', { preHandler: admin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { action: 'approve' | 'reject' | 'mark_paid' | 'mark_failed'; notes?: string; paymentRef?: string };
    const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!withdrawal) return reply.code(404).send({ error: 'Withdrawal request not found' });
    const amount = Number(withdrawal.amount);

    if (body.action === 'approve') {
      if (withdrawal.status !== 'pending') return reply.code(400).send({ error: `Cannot approve from status ${withdrawal.status}` });
      await prisma.$transaction(async (tx) => {
        await tx.withdrawalRequest.update({
          where: { id }, data: { status: 'approved', reviewedAt: new Date(), reviewedBy: request.authUser!.id, notes: body.notes },
        });
        await tx.walletTransaction.create({
          data: {
            userId: withdrawal.userId, type: 'withdrawal_approved', amount: -amount, currency: withdrawal.currency,
            status: 'completed', reference: id, description: 'Withdrawal approved by admin',
          },
        });
      });
    } else if (body.action === 'reject') {
      if (withdrawal.status === 'paid') return reply.code(400).send({ error: 'Cannot reject a paid withdrawal' });
      await prisma.$transaction(async (tx) => {
        await tx.withdrawalRequest.update({
          where: { id }, data: { status: 'rejected', reviewedAt: new Date(), reviewedBy: request.authUser!.id, notes: body.notes },
        });
        await tx.walletTransaction.create({
          data: {
            userId: withdrawal.userId, type: 'withdrawal_rejected', amount, currency: withdrawal.currency,
            status: 'completed', reference: id, description: 'Withdrawal rejected — balance restored',
          },
        });
      });
    } else if (body.action === 'mark_paid') {
      if (!['approved', 'processing'].includes(withdrawal.status)) {
        return reply.code(400).send({ error: `Cannot mark paid from status ${withdrawal.status}` });
      }
      await prisma.$transaction(async (tx) => {
        await tx.withdrawalRequest.update({
          where: { id },
          data: { status: 'paid', paidAt: new Date(), reviewedBy: request.authUser!.id, paymentRef: body.paymentRef, notes: body.notes },
        });
        await tx.walletTransaction.create({
          data: {
            userId: withdrawal.userId, type: 'withdrawal_paid', amount: -amount, currency: withdrawal.currency,
            status: 'completed', reference: id, description: `Withdrawal paid${body.paymentRef ? ` (ref: ${body.paymentRef})` : ''}`,
          },
        });
        // Move confirmed commissions into 'paid' for reconciliation, up to the paid amount
        const confirmed = await tx.commission.findMany({
          where: { userId: withdrawal.userId, status: 'confirmed' }, orderBy: { createdAt: 'asc' },
        });
        let remaining = amount;
        for (const c of confirmed) {
          if (remaining <= 0) break;
          const share = Number(c.userShare);
          if (share <= remaining) {
            await tx.commission.update({ where: { id: c.id }, data: { status: 'paid', paidAt: new Date() } });
            remaining -= share;
          }
        }
      });
    } else if (body.action === 'mark_failed') {
      await prisma.withdrawalRequest.update({
        where: { id }, data: { status: 'failed', reviewedAt: new Date(), reviewedBy: request.authUser!.id, notes: body.notes },
      });
    } else {
      return reply.code(400).send({ error: 'Invalid action' });
    }

    await prisma.auditLog.create({
      data: {
        actorId: request.authUser!.id, action: `admin.withdrawal.${body.action}`, entityType: 'WithdrawalRequest', entityId: id,
        before: { status: withdrawal.status } as never,
        after: { action: body.action, notes: body.notes, paymentRef: body.paymentRef } as never,
      },
    });
    const updated = await prisma.withdrawalRequest.findUnique({ where: { id } });
    return { data: updated };
  });

  // ---- Audit logs ----
  app.get('/audit-logs', { preHandler: admin }, async (request) => {
    const q = request.query as Record<string, string>;
    const logs = await prisma.auditLog.findMany({
      where: q.action ? { action: q.action } : {},
      orderBy: { createdAt: 'desc' }, take: q.limit ? Number(q.limit) : 100,
      include: { actor: { select: { email: true, name: true } } },
    });
    return { data: logs };
  });
}