// ---------------------------------------------------------------------------
// Base Social Publisher
// ---------------------------------------------------------------------------

import type {
  SocialContent,
  SocialPublishResult,
  SocialAccountConfig,
  SocialPublisherInterface,
} from './types.js';

export abstract class BaseSocialPublisher implements SocialPublisherInterface {
  protected _name: string;
  protected _platform: string;
  protected _status: string = 'disconnected';
  protected _config: SocialAccountConfig | null = null;
  protected _mockMode: boolean = true;

  constructor(name: string, platform: string) {
    this._name = name;
    this._platform = platform;
  }

  get name(): string { return this._name; }
  get platform(): string { return this._platform; }
  get status(): string { return this._status; }

  configure(config: SocialAccountConfig): void {
    this._config = config;
    this._mockMode = !config.accessToken || config.accessToken.length === 0;
    this._status = config.accessToken ? 'connected' : 'disconnected';
  }

  abstract publishPost(content: SocialContent): Promise<SocialPublishResult>;
  abstract schedulePost(content: SocialContent, publishAt: Date): Promise<SocialPublishResult>;
  abstract getPublishingStatus(postId: string): Promise<string>;
  abstract deletePost(postId: string): Promise<boolean>;
  abstract validateAccount(): Promise<boolean>;
  abstract getOAuthUrl(): string;
  abstract handleOAuthCallback(code: string): Promise<SocialAccountConfig>;
}

export class MockSocialPublisher extends BaseSocialPublisher {
  constructor(platform: string) {
    super(`${platform} Publisher`, platform);
    this._mockMode = true;
  }

  async publishPost(content: SocialContent): Promise<SocialPublishResult> {
    return {
      success: true,
      postId: `mock-${Date.now()}`,
      postUrl: `https://example.com/posts/${Date.now()}`,
    };
  }

  async schedulePost(content: SocialContent, publishAt: Date): Promise<SocialPublishResult> {
    return {
      success: true,
      postId: `mock-scheduled-${Date.now()}`,
      postUrl: `https://example.com/scheduled/${Date.now()}`,
    };
  }

  async getPublishingStatus(postId: string): Promise<string> {
    return 'published';
  }

  async deletePost(postId: string): Promise<boolean> {
    return true;
  }

  async validateAccount(): Promise<boolean> {
    return this._status === 'connected';
  }

  getOAuthUrl(): string {
    return `https://example.com/oauth/${this._platform}?client_id=mock`;
  }

  async handleOAuthCallback(code: string): Promise<SocialAccountConfig> {
    this._status = 'connected';
    this._config = { accessToken: 'mock-token', refreshToken: 'mock-refresh', accountId: 'mock-account' };
    return this._config;
  }
}