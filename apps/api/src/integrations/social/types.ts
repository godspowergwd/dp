// ---------------------------------------------------------------------------
// Social Publishing Interfaces & Types
// ---------------------------------------------------------------------------

export interface SocialContent {
  text?: string;
  hashtags?: string[];
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
  callToAction?: string;
}

export interface SocialPublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface SocialAccountConfig {
  accessToken?: string;
  refreshToken?: string;
  accountId?: string;
}

export interface SocialPublisherInterface {
  get name(): string;
  get platform(): string;
  get status(): string;
  configure(config: SocialAccountConfig): void;
  publishPost(content: SocialContent): Promise<SocialPublishResult>;
  schedulePost(content: SocialContent, publishAt: Date): Promise<SocialPublishResult>;
  getPublishingStatus(postId: string): Promise<string>;
  deletePost(postId: string): Promise<boolean>;
  validateAccount(): Promise<boolean>;
  getOAuthUrl(): string;
  handleOAuthCallback(code: string): Promise<SocialAccountConfig>;
}

export interface ConnectedAccountInfo {
  id: string;
  provider: string;
  accountName?: string;
  accountUsername?: string;
  accountType?: string;
  status: string;
  connectedAt: Date;
  lastSyncAt?: Date;
}