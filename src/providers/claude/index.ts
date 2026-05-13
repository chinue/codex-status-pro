// DESIGN: v2-provider-abstraction.md#claude-provider
// AGENTS: keep-minimal
// ⏳ Placeholder — full implementation pending

import { IProvider, IAuthProvider, IQuotaApiProvider, ILocalUsageProvider, IPricingProvider, IUIProvider, ApiResult, UnifiedQuota, UnifiedUsageEntry, RateLimits, Currency, TokenPricing, TokenUsage } from '../base/types';

const USD: Currency = { code: 'USD', symbol: '$' };

const placeholderAuth: IAuthProvider = {
  async resolveToken() { return undefined; },
  invalidate() { /* no-op */ },
};

const placeholderApi: IQuotaApiProvider = {
  async fetchQuota() { return { ok: false, error: 'Claude provider not yet implemented' }; },
};

const placeholderLocal: ILocalUsageProvider = {
  async scanSessions() { return []; },
  async getRateLimits() { return null; },
  invalidate() { /* no-op */ },
};

const placeholderPricing: IPricingProvider = {
  currency: USD,
  defaultModelName: 'claude-sonnet-4',
  getPricing() {
    return { inputPerMillion: 3.0, outputPerMillion: 15.0, cacheReadPerMillion: 0.30, cacheCreatePerMillion: 3.75 };
  },
  calculateCost(usage: TokenUsage, pricing: TokenPricing) {
    return (usage.inputOther * pricing.inputPerMillion + usage.output * pricing.outputPerMillion +
            usage.inputCacheRead * pricing.cacheReadPerMillion + usage.inputCacheCreation * pricing.cacheCreatePerMillion) / 1_000_000;
  },
};

const claudeUIProvider: IUIProvider = {
  mainIcon: '✴️',
  statusBarName: 'Claude Code Usage',
  dashboardTitle: 'Claude Dashboard',
  displayName: 'Claude',
  officialUrl: 'https://www.anthropic.com/pricing',
  extensionDisplayName: 'ClaudeStatusPro',
};

export function createClaudeProvider(): IProvider {
  return {
    id: 'claude',
    displayName: 'Claude',
    currency: USD,
    auth: placeholderAuth,
    api: placeholderApi,
    localUsage: placeholderLocal,
    pricing: placeholderPricing,
    ui: claudeUIProvider,
  };
}
