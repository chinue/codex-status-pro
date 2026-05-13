// DESIGN: v2-provider-abstraction.md#cursor-provider
// AGENTS: keep-minimal
// ⏳ Placeholder — full implementation pending

import { IProvider, IAuthProvider, IQuotaApiProvider, ILocalUsageProvider, IPricingProvider, IUIProvider, Currency, TokenPricing, TokenUsage } from '../base/types';

const USD: Currency = { code: 'USD', symbol: '$' };

const placeholderAuth: IAuthProvider = {
  async resolveToken() { return undefined; },
  invalidate() { /* no-op */ },
};

const placeholderApi: IQuotaApiProvider = {
  async fetchQuota() { return { ok: false, error: 'Cursor provider not yet implemented' }; },
};

const placeholderLocal: ILocalUsageProvider = {
  async scanSessions() { return []; },
  async getRateLimits() { return null; },
  invalidate() { /* no-op */ },
};

const placeholderPricing: IPricingProvider = {
  currency: USD,
  defaultModelName: 'cursor-default',
  getPricing() {
    return { inputPerMillion: 2.0, outputPerMillion: 10.0, cacheReadPerMillion: 0.50, cacheCreatePerMillion: 2.00 };
  },
  calculateCost(usage: TokenUsage, pricing: TokenPricing) {
    return (usage.inputOther * pricing.inputPerMillion + usage.output * pricing.outputPerMillion +
            usage.inputCacheRead * pricing.cacheReadPerMillion + usage.inputCacheCreation * pricing.cacheCreatePerMillion) / 1_000_000;
  },
};

const cursorUIProvider: IUIProvider = {
  mainIcon: '💠',
  statusBarName: 'Cursor Code Usage',
  dashboardTitle: 'Cursor Dashboard',
  displayName: 'Cursor',
  officialUrl: 'https://cursor.com/pricing',
  extensionDisplayName: 'CursorStatusPro',
};

export function createCursorProvider(): IProvider {
  return {
    id: 'cursor',
    displayName: 'Cursor',
    currency: USD,
    auth: placeholderAuth,
    api: placeholderApi,
    localUsage: placeholderLocal,
    pricing: placeholderPricing,
    ui: cursorUIProvider,
  };
}
