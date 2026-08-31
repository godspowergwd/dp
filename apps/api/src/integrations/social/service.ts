// ---------------------------------------------------------------------------
// Social Publishing Service
// ---------------------------------------------------------------------------

import { prisma } from '../../lib/prisma.js';
import { socialPublisherRegistry, createSocialPublisher } from './registry.js';
import { logger } from '../../lib/logger.js';
import type { SocialContent, SocialPublishResult, ConnectedAccountInfo } from './types.js';
import { encrypt, decrypt } from '../../lib/crypto.js';
import { getConfig } from '../../config/env.js';

function encryptField(plain: string): string {
  return encrypt(plain, getConfig().ENCRYPTION_KEY);
}
function decryptField(payload: string): string {
  try { return decrypt(payload, getConfig().ENCRYPTION_KEY); } catch { return ''; }
}

export class SocialPublishingService {
  async getConnectedAccounts(userId: string): Promise<ConnectedAccountInfo[]> {
    const accounts = await prisma.socialAccount.findMany({
      where: { userId, status: { in: ['connected', 'reconnect_required'] } },
      select: {
        id: true, provider: true, accountName: true, accountUsername: true,
        accountType: true, status: true, connectedAt: true, lastSyncAt: true,
      },
    });
    return accounts.map((a: {
      id: string; provider: string; accountName: string | null; accountUsername: string | null;
      accountType: string | null; status: string; connectedAt: Date; lastSyncAt: Date | null;
    }) => ({
      id: a.id, provider: a.provider, accountName: a.accountName ?? undefined, accountUsername: a.accountUsername ?? undefined,
      accountType: a.accountType ?? undefined, status: a.status, connectedAt: a.connectedAt, lastSyncAt: a.lastSyncAt ?? undefined,
    }));
  }

  async getOAuthUrl(userId: string, platform: string): Promise<string> {
    const publisher = socialPublisherRegistry.get(platform) || createSocialPublisher(platform);
    return publisher.getOAuthUrl();
  }

  async connectAccount(userId: string, platform: string, code: string): Promise<any> {
    const publisher = socialPublisherRegistry.get(platform) || createSocialPublisher(platform);
    const config = await publisher.handleOAuthCallback(code);
    
    const accessToken = encryptField(config.accessToken || '');
    const refreshToken = encryptField(config.refreshToken || '');

    const account = await prisma.socialAccount.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId, provider: platform as any, providerAccountId: config.accountId ?? 'unknown',
        },
      },
      update: {
        accessTokenEncrypted: accessToken,
        refreshTokenEncrypted: refreshToken,
        tokenExpiresAt: config.accountId ? new Date(Date.now() + 3600000) : null,
        status: 'connected',
        lastSyncAt: new Date(),
      },
      create: {
        userId, provider: platform as any, providerAccountId: config.accountId ?? 'unknown',
        accessTokenEncrypted: accessToken,
        refreshTokenEncrypted: refreshToken,
        tokenExpiresAt: config.accountId ? new Date(Date.now() + 3600000) : null,
        status: 'connected',
      },
    });

    return {
      id: account.id, provider: account.provider,
      accountName: account.accountName, accountUsername: account.accountUsername,
      status: account.status, connectedAt: account.connectedAt,
    };
  }

  async disconnectAccount(userId: string, accountId: string): Promise<boolean> {
    await prisma.socialAccount.update({
      where: { id: accountId, userId },
      data: { status: 'disconnected', accessTokenEncrypted: null, refreshTokenEncrypted: null },
    });
    return true;
  }

  async publishPost(userId: string, promotionId: string, content: SocialContent): Promise<SocialPublishResult> {
    const promotion = await prisma.promotion.findFirst({
      where: { id: promotionId, userId },
      include: { socialAccount: true },
    });
    if (!promotion) throw new Error('Promotion not found');

    const platform = promotion.socialPlatform || promotion.socialAccount?.provider;
    if (!platform) throw new Error('No social platform specified');

    const publisher = socialPublisherRegistry.get(platform as string) || createSocialPublisher(platform as string);
    
    if (promotion.socialAccount) {
      const config = {
        accessToken: decryptField(promotion.socialAccount.accessTokenEncrypted || ''),
        refreshToken: decryptField(promotion.socialAccount.refreshTokenEncrypted || ''),
        accountId: promotion.socialAccount.providerAccountId ?? undefined,
      };
      publisher.configure(config);
    }

    const result = await publisher.publishPost(content);
    
    await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        publishingStatus: result.success ? 'published' : 'failed',
        providerPostId: result.postId || null,
        postUrl: result.postUrl || null,
        publishedAt: result.success ? new Date() : null,
        status: result.success ? 'published' : 'failed',
      },
    });

    return result;
  }

  async validateAccount(userId: string, accountId: string): Promise<boolean> {
    const account = await prisma.socialAccount.findFirst({ where: { id: accountId, userId, status: 'connected' } });
    if (!account) return false;
    
    const publisher = createSocialPublisher(account.provider as string);
    const config = {
      accessToken: decryptField(account.accessTokenEncrypted || ''),
      refreshToken: decryptField(account.refreshTokenEncrypted || ''),
      accountId: account.providerAccountId ?? undefined,
    };
    publisher.configure(config);
    return publisher.validateAccount();
  }

  getSupportedPlatforms(): string[] {
    return socialPublisherRegistry.getAll().map(p => p.platform);
  }
}

export const socialPublishingService = new SocialPublishingService();