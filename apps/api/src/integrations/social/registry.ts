// ---------------------------------------------------------------------------
// Social Publisher Registry
// ---------------------------------------------------------------------------

import type { SocialPublisherInterface, SocialAccountConfig } from './types.js';
import { MockSocialPublisher } from './base.js';

export class SocialPublisherRegistry {
  private publishers: Map<string, SocialPublisherInterface> = new Map();

  register(publisher: SocialPublisherInterface): void {
    this.publishers.set(publisher.platform, publisher);
  }

  get(platform: string): SocialPublisherInterface | undefined {
    return this.publishers.get(platform);
  }

  getAll(): SocialPublisherInterface[] {
    return Array.from(this.publishers.values());
  }

  unregister(platform: string): void {
    this.publishers.delete(platform);
  }
}

export function createSocialPublisher(platform: string): SocialPublisherInterface {
  // Factory: returns the appropriate publisher based on platform
  // Real API publishers will be added here when credentials are available
  // case 'facebook': return new FacebookPublisher();
  // case 'instagram': return new InstagramPublisher();
  // case 'tiktok': return new TikTokPublisher();
  return new MockSocialPublisher(platform);
}

export const socialPublisherRegistry = new SocialPublisherRegistry();

// Initialize with mock publishers for all supported platforms
['facebook', 'instagram', 'tiktok'].forEach(p => {
  socialPublisherRegistry.register(new MockSocialPublisher(p));
});