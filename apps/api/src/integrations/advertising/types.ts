// ---------------------------------------------------------------------------
// Advertising Integration Types & Base
// ---------------------------------------------------------------------------

export interface AdCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  budget: number;
  currency: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdCreative {
  id: string;
  name: string;
  type: 'image' | 'video' | 'text';
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  status: string;
}

export interface AdvertisingProviderInterface {
  get name(): string;
  get platform(): string;
  get status(): string;
  configure(config: Record<string, unknown>): void;
  validateAccount(): Promise<boolean>;
  getOAuthUrl(): string;
  handleOAuthCallback(code: string): Promise<Record<string, unknown>>;
  listCampaigns(): Promise<AdCampaign[]>;
  createCampaign(data: Record<string, unknown>): Promise<AdCampaign>;
  getCampaign(id: string): Promise<AdCampaign | null>;
  getCampaignPerformance(id: string): Promise<Record<string, unknown>>;
  listCreatives(): Promise<AdCreative[]>;
  createCreative(data: Record<string, unknown>): Promise<AdCreative>;
}

export class BaseAdvertisingProvider implements AdvertisingProviderInterface {
  protected _name: string;
  protected _platform: string;
  protected _status: string = 'disconnected';

  constructor(name: string, platform: string) {
    this._name = name;
    this._platform = platform;
  }

  get name(): string { return this._name; }
  get platform(): string { return this._platform; }
  get status(): string { return this._status; }
  configure(_config: Record<string, unknown>): void { this._status = 'connected'; }
  async validateAccount(): Promise<boolean> { return false; }
  getOAuthUrl(): string { return ''; }
  async handleOAuthCallback(_code: string): Promise<Record<string, unknown>> { return {}; }
  async listCampaigns(): Promise<AdCampaign[]> { return []; }
  async createCampaign(_data: Record<string, unknown>): Promise<AdCampaign> { throw new Error('Not connected'); }
  async getCampaign(_id: string): Promise<AdCampaign | null> { return null; }
  async getCampaignPerformance(_id: string): Promise<Record<string, unknown>> { return {}; }
  async listCreatives(): Promise<AdCreative[]> { return []; }
  async createCreative(_data: Record<string, unknown>): Promise<AdCreative> { throw new Error('Not connected'); }
}

// Mock advertising provider (placeholder for future integrations)
export class MockAdvertisingProvider extends BaseAdvertisingProvider {
  constructor(platform: string) {
    super(`${platform} Ads`, platform);
    this._status = 'not_configured';
  }

  async validateAccount(): Promise<boolean> { return false; }
  getOAuthUrl(): string { return `https://example.com/oauth/${this._platform}?client_id=mock`; }
  async listCampaigns(): Promise<AdCampaign[]> { return []; }
}

export const advertisingProviders: Record<string, BaseAdvertisingProvider> = {
  facebook: new MockAdvertisingProvider('facebook'),
  instagram: new MockAdvertisingProvider('instagram'),
  tiktok: new MockAdvertisingProvider('tiktok'),
  linkedin: new MockAdvertisingProvider('linkedin'),
  twitter: new MockAdvertisingProvider('twitter'),
  youtube: new MockAdvertisingProvider('youtube'),
  pinterest: new MockAdvertisingProvider('pinterest'),
};