// ---------------------------------------------------------------------------
// Base Affiliate Provider
// ---------------------------------------------------------------------------

import type {
  AffiliateProductData,
  AffiliateLinkOptions,
  AffiliateConversion,
  AffiliateProviderConfig,
  AffiliateProviderInterface,
  ProviderInfo,
} from './types.js';

export abstract class BaseAffiliateProvider implements AffiliateProviderInterface {
  protected _name: string;
  protected _type: string;
  protected _status: string = 'active';
  protected _supportedFeatures: string[] = [];
  protected _config: AffiliateProviderConfig | null = null;
  protected _syncStatus: string = 'idle';
  protected _lastSyncAt: Date | null = null;
  protected _mockMode: boolean = false;

  constructor(name: string, type: string) {
    this._name = name;
    this._type = type;
  }

  get name(): string { return this._name; }
  get type(): string { return this._type; }
  get status(): string { return this._status; }
  get supportedFeatures(): string[] { return this._supportedFeatures; }
  get syncStatus(): string { return this._syncStatus; }
  get lastSyncAt(): Date | null { return this._lastSyncAt; }

  configure(config: AffiliateProviderConfig): void {
    this._config = config;
    this._mockMode = !config.apiKey || config.apiKey.length === 0;
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this._name,
      type: this._type,
      status: this._status,
      supportedFeatures: [...this._supportedFeatures],
      syncStatus: this._syncStatus,
      lastSyncAt: this._lastSyncAt ?? undefined,
      config: this._mockMode ? { mockMode: true } : undefined,
    };
  }

  setSyncStatus(status: string): void {
    this._syncStatus = status;
    this._lastSyncAt = new Date();
  }

  // Abstract methods that subclasses must implement
  abstract fetchProducts(options?: Record<string, unknown>): Promise<AffiliateProductData[]>;
  abstract getProductDetails(providerProductId: string): Promise<AffiliateProductData | null>;
  abstract getAffiliateLink(providerProductId: string, options?: AffiliateLinkOptions): Promise<string>;
  abstract getProductAvailability(providerProductId: string): Promise<{ available: boolean; stockStatus?: string }>;
  abstract getCommissionInformation(providerProductId: string): Promise<{ commissionType?: string; commissionValue?: number; estimatedCommission?: number }>;
  abstract syncConversions(since?: Date): Promise<AffiliateConversion[]>;
  abstract getTrackingCapability(): 'sub_id' | 'tracking_id' | 'campaign_id' | 'custom_param' | 'none';
  abstract testConnection(): Promise<boolean>;

  // Default implementations for optional methods
  async getCommissionInformationDefault(): Promise<{ commissionType?: string; commissionValue?: number; estimatedCommission?: number }> {
    return { commissionType: 'percentage', commissionValue: 4.0, estimatedCommission: 0 };
  }
}