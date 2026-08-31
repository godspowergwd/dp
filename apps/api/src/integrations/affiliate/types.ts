// ---------------------------------------------------------------------------
// Affiliate Integration Interfaces & Types
// ---------------------------------------------------------------------------

export interface AffiliateProductData {
  providerProductId: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  images: string[];
  price: number;
  currency: string;
  originalPrice?: number;
  discount?: number;
  availability: string;
  stockStatus?: string;
  productUrl?: string;
  affiliateUrl?: string;
  commissionType?: string;
  commissionValue?: number;
  estimatedCommission?: number;
  rating?: number;
  reviewsCount?: number;
  brand?: string;
  tags?: string[];
}

export interface AffiliateLinkOptions {
  trackingReference?: string;
  subId1?: string;
  subId2?: string;
  campaignId?: string;
}

export interface AffiliateConversion {
  transactionId: string;
  promotionId?: string;
  trackingReference?: string;
  saleAmount: number;
  commissionAmount: number;
  currency: string;
  status: string;
  detectedAt: Date;
  confirmedAt?: Date;
}

export interface AffiliateProviderConfig {
  name: string;
  type: string;
  apiKey?: string;
  apiSecret?: string;
  associateTag?: string;
  region?: string;
  baseUrl?: string;
  additionalConfig?: Record<string, unknown>;
}

export interface AffiliateProviderInterface {
  get name(): string;
  get type(): string;
  get status(): string;
  get supportedFeatures(): string[];
  configure(config: AffiliateProviderConfig): void;
  fetchProducts(options?: Record<string, unknown>): Promise<AffiliateProductData[]>;
  getProductDetails(providerProductId: string): Promise<AffiliateProductData | null>;
  getAffiliateLink(providerProductId: string, options?: AffiliateLinkOptions): Promise<string>;
  getProductAvailability(providerProductId: string): Promise<{ available: boolean; stockStatus?: string }>;
  getCommissionInformation(providerProductId: string): Promise<{ commissionType?: string; commissionValue?: number; estimatedCommission?: number }>;
  syncConversions(since?: Date): Promise<AffiliateConversion[]>;
  getTrackingCapability(): 'sub_id' | 'tracking_id' | 'campaign_id' | 'custom_param' | 'none';
  testConnection(): Promise<boolean>;
}

export interface ProviderInfo {
  name: string;
  type: string;
  status: string;
  supportedFeatures: string[];
  syncStatus: string;
  lastSyncAt?: Date;
  config?: Record<string, unknown>;
}