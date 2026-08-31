// Affiliate Service - Syncs products from providers to DB
import { prisma } from '../../lib/prisma.js';
import { providerRegistry } from './registry.js';
import { logger } from '../../lib/logger.js';
import type { AffiliateConversion, ProviderInfo, AffiliateProviderConfig } from './types.js';

export class AffiliateService {
  async syncProducts(providerName: string, options: Record<string, unknown> = {}): Promise<number> {
    const provider = providerRegistry.get(providerName);
    if (!provider) throw new Error(`Provider ${providerName} not found`);
    (provider as any).setSyncStatus?.('syncing');
    const products = await provider.fetchProducts(options);
    let synced = 0;
    for (const productData of products) {
      const providerRecord = await prisma.affiliateProvider.findUnique({ where: { name: provider.name } });
      if (!providerRecord) continue;
      await prisma.affiliateProduct.upsert({
        where: { providerId_providerProductId: { providerId: providerRecord.id, providerProductId: productData.providerProductId } },
        update: this.mapProduct(productData),
        create: { ...this.mapProduct(productData), providerId: providerRecord.id, providerProductId: productData.providerProductId },
      });
      synced++;
    }
    (provider as any).setSyncStatus?.('idle');
    await prisma.affiliateProvider.update({ where: { name: provider.name }, data: { syncStatus: 'idle', lastSyncAt: new Date() } });
    return synced;
  }

  private mapProduct(data: any) {
    return {
      title: data.title, description: data.description, shortDescription: data.shortDescription,
      category: data.category, images: data.images as any, price: data.price, currency: data.currency,
      originalPrice: data.originalPrice ?? null, discount: data.discount ?? null, availability: data.availability,
      stockStatus: data.stockStatus, productUrl: data.productUrl, affiliateUrl: data.affiliateUrl,
      commissionType: data.commissionType, commissionValue: data.commissionValue ?? null,
      estimatedCommission: data.estimatedCommission ?? null, rating: data.rating ?? null,
      reviewsCount: data.reviewsCount, brand: data.brand, tags: data.tags as any,
      status: data.availability === 'in_stock' ? 'active' : 'inactive', lastSyncedAt: new Date(), updatedAt: new Date(),
    };
  }

  async syncAllProviders(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    for (const provider of providerRegistry.getAll()) {
      try { results[provider.name] = await this.syncProducts(provider.name); }
      catch (e) { logger.error({ err: e, provider: provider.name }, 'Failed to sync'); results[provider.name] = 0; }
    }
    return results;
  }

  async getProducts(options: {
    search?: string; provider?: string; category?: string; minPrice?: number;
    maxPrice?: number; sortBy?: 'price' | 'commission' | 'popularity';
    sortOrder?: 'asc' | 'desc'; limit?: number; offset?: number;
  } = {}): Promise<any[]> {
    const where: any = { status: 'active' };
    if (options.search) where.OR = [{ title: { contains: options.search } }, { description: { contains: options.search } }, { brand: { contains: options.search } }];
    if (options.provider) where.provider = { name: options.provider };
    if (options.category) where.category = options.category;
    if (options.minPrice || options.maxPrice) { where.price = {}; if (options.minPrice) where.price.gte = options.minPrice; if (options.maxPrice) where.price.lte = options.maxPrice; }
    const orderBy: any = {};
    if (options.sortBy === 'price') orderBy.price = options.sortOrder || 'asc';
    else if (options.sortBy === 'commission') orderBy.estimatedCommission = options.sortOrder || 'desc';
    else orderBy.createdAt = 'desc';
    return prisma.affiliateProduct.findMany({
      where, orderBy, take: options.limit ?? 50, skip: options.offset ?? 0,
      include: { provider: { select: { name: true, type: true, status: true } } },
    });
  }

  async getProductById(id: string): Promise<any | null> {
    return prisma.affiliateProduct.findUnique({ where: { id }, include: { provider: { select: { name: true, type: true, status: true } } } });
  }

  async syncConversions(providerName: string, since?: Date): Promise<AffiliateConversion[]> {
    const provider = providerRegistry.get(providerName);
    if (!provider) throw new Error(`Provider ${providerName} not found`);
    return provider.syncConversions(since);
  }

  getProviderInfos(): ProviderInfo[] { return providerRegistry.getProviderInfos(); }
  configureProvider(name: string, config: AffiliateProviderConfig): void { providerRegistry.configureProvider(name, config); }
}

export const affiliateService = new AffiliateService();