// DESIGN: v2-provider-abstraction.md#kimi-pricing
// AGENTS: keep-minimal

import { IPricingProvider, Currency, TokenPricing, TokenUsage } from '../base/types';

const CNY: Currency = { code: 'CNY', symbol: '¥' };

export const DEFAULT_KIMI_PRICING: TokenPricing = {
  inputPerMillion: 6.50,
  outputPerMillion: 27.00,
  cacheReadPerMillion: 1.10,
  cacheCreatePerMillion: 6.50,
};

export class KimiPricingProvider implements IPricingProvider {
  readonly currency = CNY;
  readonly defaultModelName = 'kimi-k2.6';

  getPricing(modelName: string): TokenPricing {
    // Kimi currently uses a single model pricing
    return DEFAULT_KIMI_PRICING;
  }

  calculateCost(usage: TokenUsage, pricing: TokenPricing): number {
    const inputCost = (usage.inputOther * pricing.inputPerMillion) / 1_000_000;
    const outputCost = (usage.output * pricing.outputPerMillion) / 1_000_000;
    const cacheReadCost = (usage.inputCacheRead * pricing.cacheReadPerMillion) / 1_000_000;
    const cacheCreateCost = (usage.inputCacheCreation * pricing.cacheCreatePerMillion) / 1_000_000;
    return inputCost + outputCost + cacheReadCost + cacheCreateCost;
  }
}
