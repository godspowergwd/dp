// ---------------------------------------------------------------------------
// Affiliate Provider Registry & Factory
// ---------------------------------------------------------------------------

import type { AffiliateProviderInterface, AffiliateProviderConfig, ProviderInfo } from './types.js';
import { MockAffiliateProvider } from './providers/mock.js';

export class AffiliateProviderRegistry {
  private providers: Map<string, AffiliateProviderInterface> = new Map();

  register(provider: AffiliateProviderInterface): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): AffiliateProviderInterface | undefined {
    return this.providers.get(name);
  }

  getAll(): AffiliateProviderInterface[] {
    return Array.from(this.providers.values());
  }

  getProviderInfos(): ProviderInfo[] {
    return Array.from(this.providers.values()).map((p) => {
      const info = (p as any).getProviderInfo ? (p as any).getProviderInfo() : {
        name: p.name, type: p.type, status: p.status, supportedFeatures: p.supportedFeatures,
      };
      return info;
    });
  }

  configureProvider(name: string, config: AffiliateProviderConfig): void {
    const provider = this.get(name);
    if (provider) provider.configure(config);
  }

  unregister(name: string): void {
    this.providers.delete(name);
  }
}

export function createProvider(type: string, name: string): AffiliateProviderInterface {
  // Factory: returns the appropriate provider based on type
  // Real API providers will be added here when credentials are available
  switch (type.toLowerCase()) {
    // case 'amazon': return new AmazonAffiliateProvider();
    // case 'jumia': return new JumiaAffiliateProvider();
    // case 'aliexpress': return new AliExpressAffiliateProvider();
    // case 'ebay': return new EbayAffiliateProvider();
    // case 'temu': return new TemuAffiliateProvider();
    default:
      return new MockAffiliateProvider();
  }
}

export const providerRegistry = new AffiliateProviderRegistry();

// ---------------------------------------------------------------------------
// Default provider registration.
// All providers run in DEMO/mock mode until real API credentials are added to
// the environment (AMAZON_API_KEY, JUMIA_API_KEY, ...) and the real adapter
// implementations replace the mocks in createProvider() above.
// ---------------------------------------------------------------------------
const DEMO_PROVIDERS: Array<[string, string]> = [
  ['amazon', 'amazon'],
  ['jumia', 'jumia'],
  ['aliexpress', 'aliexpress'],
  ['ebay', 'ebay'],
  ['temu', 'temu'],
];
for (const [name, type] of DEMO_PROVIDERS) {
  providerRegistry.register(new MockAffiliateProvider(name, type));
}