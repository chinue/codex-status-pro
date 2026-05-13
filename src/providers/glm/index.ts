// DESIGN: v2-provider-abstraction.md#glm-provider
// AGENTS: keep-minimal
// ⏳ Placeholder — full implementation pending

import { IProvider, IAuthProvider, IQuotaApiProvider, ILocalUsageProvider, IPricingProvider, IUIProvider, Currency, TokenPricing, TokenUsage } from '../base/types';

const CNY: Currency = { code: 'CNY', symbol: '¥' };

const placeholderAuth: IAuthProvider = {
  async resolveToken() { return undefined; },
  invalidate() { /* no-op */ },
};

const placeholderApi: IQuotaApiProvider = {
  async fetchQuota() { return { ok: false, error: 'GLM provider not yet implemented' }; },
};

const placeholderLocal: ILocalUsageProvider = {
  async scanSessions() { return []; },
  async getRateLimits() { return null; },
  invalidate() { /* no-op */ },
};

const placeholderPricing: IPricingProvider = {
  currency: CNY,
  defaultModelName: 'glm-4',
  getPricing() {
    return { inputPerMillion: 1.0, outputPerMillion: 2.0, cacheReadPerMillion: 0.5, cacheCreatePerMillion: 1.0 };
  },
  calculateCost(usage: TokenUsage, pricing: TokenPricing) {
    return (usage.inputOther * pricing.inputPerMillion + usage.output * pricing.outputPerMillion +
            usage.inputCacheRead * pricing.cacheReadPerMillion + usage.inputCacheCreation * pricing.cacheCreatePerMillion) / 1_000_000;
  },
};

const glmUIProvider: IUIProvider = {
  mainIcon: '🧠',
  statusBarName: 'GLM Code Usage',
  dashboardTitle: 'GLM Dashboard',
  displayName: 'GLM',
  officialUrl: 'https://open.bigmodel.cn/pricing',
  extensionDisplayName: 'GLMStatusPro',
};

export function createGlmProvider(): IProvider {
  return {
    id: 'glm',
    displayName: 'GLM',
    currency: CNY,
    auth: placeholderAuth,
    api: placeholderApi,
    localUsage: placeholderLocal,
    pricing: placeholderPricing,
    ui: glmUIProvider,
  };
}
