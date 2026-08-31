// ---------------------------------------------------------------------------
// Promotion Service
// ---------------------------------------------------------------------------

import { prisma } from '../lib/prisma.js';
import { randomUUID } from 'node:crypto';
import { providerRegistry } from './affiliate/registry.js';
import type { PromotionStatus } from '@prisma/client';

export class PromotionService {
  async createPromotion(userId: string, productId: string, data: {
    socialPlatform?: string;
    socialAccountId?: string;
  } = {}): Promise<any> {
    const product = await prisma.affiliateProduct.findUnique({
      where: { id: productId },
      include: { provider: true },
    });
    if (!product) throw new Error('Product not found');

    // USER_ID + PRODUCT_ID + PROMOTION_ID style tracking reference.
    // Each provider adapter decides how this is embedded in the affiliate URL.
    const trackingReference = `${userId.slice(0, 8)}-${product.id.slice(0, 8)}-${randomUUID().slice(0, 8)}`;

    // Ask the provider adapter to build the tracking-enabled affiliate link.
    let affiliateUrl = product.affiliateUrl || product.productUrl || '';
    const provider = providerRegistry.get(product.provider.name);
    if (provider) {
      try {
        affiliateUrl = await provider.getAffiliateLink(product.providerProductId, {
          trackingReference,
        });
      } catch {
        // fall back to stored affiliate URL if adapter fails
      }
    }

    const promotion = await prisma.promotion.create({
      data: {
        userId,
        productId: product.id,
        affiliateProvider: product.provider.name,
        affiliateLink: affiliateUrl,
        trackingReference,
        socialPlatform: data.socialPlatform as any,
        socialAccountId: data.socialAccountId,
        status: 'draft',
        publishingStatus: 'pending',
        estimatedEarnings: product.estimatedCommission ?? 0,
      },
    });

    return promotion;
  }

  async getUserPromotions(userId: string, options: {
    status?: string; limit?: number; offset?: number;
  } = {}): Promise<any[]> {
    const where: any = { userId };
    if (options.status) where.status = options.status;
    
    return prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
      include: {
        product: { select: { id: true, title: true, images: true, price: true, currency: true } },
        socialAccount: { select: { id: true, provider: true, accountName: true } },
      },
    });
  }

  async getPromotionById(id: string, userId: string): Promise<any | null> {
    return prisma.promotion.findFirst({
      where: { id, userId },
      include: {
        product: true,
        socialAccount: true,
        commissions: true,
      },
    });
  }

  async updatePromotion(id: string, userId: string, data: {
    status?: PromotionStatus;
    socialPlatform?: string;
    socialAccountId?: string | null;
    generatedContent?: any;
    generatedImage?: string | null;
    generatedVideo?: string | null;
  }): Promise<any> {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.socialPlatform !== undefined) updateData.socialPlatform = data.socialPlatform as any;
    if (data.socialAccountId !== undefined) updateData.socialAccountId = data.socialAccountId;
    if (data.generatedContent) updateData.generatedContent = data.generatedContent as any;
    if (data.generatedImage) updateData.generatedImage = data.generatedImage;
    if (data.generatedVideo) updateData.generatedVideo = data.generatedVideo;

    return prisma.promotion.update({
      where: { id, userId },
      data: updateData,
    });
  }

  async getAIContent(productId: string): Promise<any> {
    const product = await prisma.affiliateProduct.findUnique({
      where: { id: productId },
    });
    if (!product) throw new Error('Product not found');

    // Generate mock AI content (placeholder for real AI integration)
    return {
      product: {
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        discount: product.discount,
        category: product.category,
        images: product.images,
        brand: product.brand,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
      },
      suggestions: [
        {
          type: 'facebook_post',
          title: 'Facebook Post',
          content: `🔥 Check out the ${product.title} from ${product.brand || 'our favorite brand'}! Only ${product.price} ${product.currency}${product.discount ? ` (Save ${product.discount}%)` : ''}. Click the link to shop now!`,
          hashtags: ['#ProductLaunch', '#DealAlert', '#Shopping'],
        },
        {
          type: 'instagram_caption',
          title: 'Instagram Caption',
          content: `✨ ${product.title} ✨\n\n${product.shortDescription || product.description?.slice(0, 100)}...\n\n${product.price} ${product.currency} ${product.discount ? `🔥 ${product.discount}% OFF 🔥` : ''}\n\nTap the link in bio to shop!`,
          hashtags: ['#InstaFinds', '#DealOfTheDay', '#ShopNow', '#Affiliate'],
        },
        {
          type: 'tiktok_script',
          title: 'TikTok Script',
          content: `🎥 [Upbeat music]\n\n Hey everyone! 🎉\n\nToday I'm showing you the ${product.title}!\n\nPrice: ${product.price} ${product.currency}${product.discount ? ` with ${product.discount}% off!` : ''}\n\n${product.shortDescription || 'Check out the link below!'}\n\nDon't forget to click the link in my bio! 🔗`,
          hashtags: ['#TikTokFinds', '#FYP', '#DealAlert', '#Shopping'],
        },
        {
          type: 'ad_copy_short',
          title: 'Short Ad Copy',
          content: `${product.title} - Just ${product.price} ${product.currency}${product.discount ? ` (${product.discount}% off)` : ''}. Limited time!`,
          hashtags: ['#Ad', '#LimitedOffer'],
        },
        {
          type: 'headline',
          title: 'Headline',
          content: `${product.brand ? product.brand + ' ' : ''}${product.title}: The Best ${product.category || 'Product'} You Need!`,
        },
        {
          type: 'cta',
          title: 'Call To Action',
          content: 'Shop now and use code SAVE for extra discount!',
        },
      ],
    };
  }

  async deletePromotion(id: string, userId: string): Promise<void> {
    await prisma.promotion.delete({ where: { id, userId } });
  }
}

export const promotionService = new PromotionService();