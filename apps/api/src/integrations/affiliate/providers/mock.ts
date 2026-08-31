// ---------------------------------------------------------------------------
// Mock Affiliate Provider (Placeholder for real API implementations)
// ---------------------------------------------------------------------------

import { BaseAffiliateProvider } from '../base.js';
import type {
  AffiliateProductData,
  AffiliateLinkOptions,
  AffiliateConversion,
} from '../types.js';

const MOCK_CATEGORIES = ['Electronics', 'Home & Kitchen', 'Fashion', 'Beauty', 'Sports', 'Toys', 'Books', 'Garden'];
const MOCK_BRANDS = ['TechPro', 'HomeLux', 'FashionCore', 'BeautyGlow', 'SportMax', 'ToyLand', 'BookWorld', 'GardenPro'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function generateMockProducts(count: number): AffiliateProductData[] {
  const products: AffiliateProductData[] = [];
  for (let i = 1; i <= count; i++) {
    const category: string = pick(MOCK_CATEGORIES);
    const brand: string = pick(MOCK_BRANDS);
    const price = Math.floor(Math.random() * 20000 + 500) / 100;
    const discount = Math.floor(Math.random() * 3) * 10;
    const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100) * 100) / 100 : price;
    const rating = (Math.random() * 2 + 3).toFixed(1);
    const reviewsCount = Math.floor(Math.random() * 500 + 10);
    const commissionValue = Math.round((price * 0.05 + Math.random() * 0.05) * 1000) / 1000;

    products.push({
      providerProductId: `mock-${i}`,
      title: `${brand} ${category} Product ${i}`,
      description: `High-quality ${brand} product in the ${category.toLowerCase()} category. Perfect for everyday use with premium materials and reliable performance.`,
      shortDescription: `Premium ${brand} ${category.toLowerCase()} item with excellent value and fast shipping.`,
      category: category,
      images: [
        `https://via.placeholder.com/400x400?text=Product+${i}+Image+1`,
        `https://via.placeholder.com/400x400?text=Product+${i}+Image+2`,
        `https://via.placeholder.com/400x400?text=Product+${i}+Image+3`,
      ],
      price: price,
      currency: 'USD',
      originalPrice: originalPrice,
      discount: discount,
      availability: Math.random() > 0.1 ? 'in_stock' : 'out_of_stock',
      stockStatus: Math.random() > 0.1 ? 'In Stock' : 'Out of Stock',
      productUrl: `https://example.com/product/${i}`,
      affiliateUrl: `https://track.example.com/click?pid=mock-${i}&af_id=default&sub_id=mock`,
      commissionType: 'percentage',
      commissionValue: commissionValue,
      estimatedCommission: price * 0.05,
      rating: parseFloat(rating),
      reviewsCount: reviewsCount,
      brand: brand,
      tags: [category.toLowerCase(), brand.toLowerCase(), 'featured'],
    });
  }
  return products;
}

export class MockAffiliateProvider extends BaseAffiliateProvider {
  private products: AffiliateProductData[] = [];

  constructor(name = 'Mock Provider', type = 'other') {
    super(name, type);
    this._supportedFeatures = ['search', 'categories', 'pricing', 'commissions', 'availability'];
    this._mockMode = true;
    this.products = generateMockProducts(24);
  }

  async fetchProducts(options: Record<string, unknown> = {}): Promise<AffiliateProductData[]> {
    let results = [...this.products];
    const query = (options.query as string | undefined)?.toLowerCase() || '';
    const category = options.category as string | undefined;
    const limit = (options.limit as number) || 50;

    if (query) {
      results = results.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query)
      );
    }

    if (category) {
      results = results.filter(p => p.category === category);
    }

    return results.slice(0, limit);
  }

  async getProductDetails(providerProductId: string): Promise<AffiliateProductData | null> {
    return this.products.find(p => p.providerProductId === providerProductId) ?? null;
  }

  async getAffiliateLink(providerProductId: string, options: AffiliateLinkOptions = {}): Promise<string> {
    const product = this.products.find(p => p.providerProductId === providerProductId);
    if (!product) return '';

    // Build tracking URL with sub_id
    const params = new URLSearchParams();
    params.set('pid', providerProductId);
    params.set('af_id', 'default');
    if (options.trackingReference) params.set('sub_id', options.trackingReference);
    if (options.campaignId) params.set('campaign_id', options.campaignId);

    return `https://track.example.com/click?${params.toString()}`;
  }

  async getProductAvailability(providerProductId: string): Promise<{ available: boolean; stockStatus?: string }> {
    const product = this.products.find(p => p.providerProductId === providerProductId);
    if (!product) return { available: false, stockStatus: 'Not Found' };
    return { available: product.availability === 'in_stock', stockStatus: product.stockStatus };
  }

  async getCommissionInformation(providerProductId: string): Promise<{ commissionType?: string; commissionValue?: number; estimatedCommission?: number }> {
    const product = this.products.find(p => p.providerProductId === providerProductId);
    if (!product) return {};
    return {
      commissionType: product.commissionType,
      commissionValue: product.commissionValue,
      estimatedCommission: product.estimatedCommission,
    };
  }

  async syncConversions(since?: Date): Promise<AffiliateConversion[]> {
    // Mock: no conversions in dev mode
    return [];
  }

  getTrackingCapability(): 'sub_id' | 'tracking_id' | 'campaign_id' | 'custom_param' | 'none' {
    return 'custom_param';
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}