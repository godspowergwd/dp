// Earnings / Commission Service
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { providerRegistry } from './affiliate/registry.js';
import { affiliateService } from './affiliate/service.js';

export class EarningsService {
  async getWalletBalance(userId: string): Promise<{
    estimated: number; pending: number; available: number; paid: number; total: number; reserved: number;
  }> {
    const commissions = await prisma.commission.findMany({
      where: { userId }, select: { status: true, userShare: true },
    });
    let estimated = 0, pending = 0, available = 0, paid = 0;
    for (const c of commissions) {
      switch (c.status) {
        case 'estimated': estimated += Number(c.userShare); break;
        case 'pending': pending += Number(c.userShare); break;
        case 'confirmed': available += Number(c.userShare); break;
        case 'paid': paid += Number(c.userShare); break;
      }
    }
    // Reserved: amounts locked by active (pending/approved/processing) withdrawal requests
    const activeWithdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId, status: { in: ['pending', 'approved', 'processing'] } },
      select: { amount: true },
    });
    const reserved = activeWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    return {
      estimated, pending,
      available: Math.max(0, available - reserved),
      reserved,
      paid, total: estimated + pending + available + paid,
    };
  }

  async getCommissionHistory(userId: string, options: { status?: string; limit?: number; offset?: number } = {}): Promise<any[]> {
    const where: any = { userId };
    if (options.status) where.status = options.status;
    return prisma.commission.findMany({
      where, orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50, skip: options.offset ?? 0,
      include: { promotion: { select: { id: true, trackingReference: true, product: { select: { title: true } } } },
        product: { select: { title: true } }, provider: { select: { name: true } } },
    });
  }

  async syncCommissions(providerName?: string, since?: Date): Promise<any> {
    const providers = providerName ? [providerName] : providerRegistry.getAll().map(p => p.name);
    let totalDetected = 0;
    for (const provider of providers) {
      try {
        const conversions = await affiliateService.syncConversions(provider, since);
        for (const conv of conversions) {
          const promotion = await prisma.promotion.findUnique({ where: { trackingReference: conv.trackingReference || '' } });
          if (!promotion) continue;
          const providerRecord = await prisma.affiliateProvider.findUnique({ where: { name: provider } });
          if (!providerRecord) continue;
          const existing = await prisma.commission.findFirst({ where: { providerTransactionId: conv.transactionId, affiliateProviderId: providerRecord.id } });
          if (existing) continue;
          const commission = await prisma.commission.create({
            data: { userId: promotion.userId, promotionId: promotion.id, productId: promotion.productId,
              affiliateProviderId: providerRecord.id, providerTransactionId: conv.transactionId,
              saleAmount: conv.saleAmount, commissionAmount: conv.commissionAmount, platformShare: 0, userShare: conv.commissionAmount,
              currency: conv.currency, status: 'pending', detectedAt: conv.detectedAt, confirmedAt: conv.confirmedAt },
          });
          await prisma.walletTransaction.create({
            data: { userId: promotion.userId, type: 'commission_pending', amount: conv.commissionAmount,
              currency: conv.currency, status: 'pending', reference: commission.id,
              description: `Commission from ${conv.transactionId}`, relatedCommissionId: commission.id },
          });
          totalDetected++;
        }
      } catch (e) { logger.error({ err: e, provider }, 'Failed to sync conversions'); }
    }
    return { providers: providers.length, conversionsDetected: totalDetected };
  }

  async approveCommission(commissionId: string): Promise<void> {
    const commission = await prisma.commission.findUnique({ where: { id: commissionId } });
    if (!commission) throw new Error('Commission not found');
    await prisma.commission.update({ where: { id: commissionId }, data: { status: 'confirmed', confirmedAt: new Date() } });
    await prisma.walletTransaction.updateMany({
      where: { relatedCommissionId: commissionId, type: 'commission_pending' },
      data: { status: 'completed', type: 'commission_confirmed', description: 'Commission confirmed' },
    });
    await prisma.walletTransaction.create({
      data: { userId: commission.userId, type: 'commission_confirmed', amount: commission.userShare,
        currency: commission.currency, status: 'completed', reference: commission.id,
        description: 'Commission confirmed and available for withdrawal', relatedCommissionId: commissionId },
    });
  }

  async getWithdrawalHistory(userId: string): Promise<any[]> {
    return prisma.withdrawalRequest.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' },
      select: { id: true, amount: true, currency: true, payoutMethod: true, status: true,
        requestedAt: true, reviewedAt: true, paidAt: true, paymentRef: true, notes: true },
    });
  }

  async requestWithdrawal(userId: string, amount: number, method: string, details: any): Promise<any> {
    const balance = await this.getWalletBalance(userId);
    if (balance.available < amount) throw new Error('Insufficient available balance');
    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalRequest.create({
        data: { userId, amount, currency: 'USD', payoutMethod: method, payoutDetails: details as any, status: 'pending' },
      });
      await tx.walletTransaction.create({
        data: { userId, type: 'withdrawal_request', amount: -amount, currency: 'USD',
          status: 'completed', reference: withdrawal.id, description: `Withdrawal request #${withdrawal.id.slice(0, 8)}` },
      });
      return withdrawal;
    });
    return result;
  }
}

export const earningsService = new EarningsService();