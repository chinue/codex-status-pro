// DESIGN: v2-provider-abstraction.md#claude-pricing
// AGENTS: keep-minimal

import { IPricingProvider, Currency, TokenPricing, TokenUsage } from '../base/types';

const USD: Currency = { code: 'USD', symbol: '$' };

export const DEFAULT_CLAUDE_PRICING = {
  opus: {
    inputPerMillion: 5.00,
    outputPerMillion: 25.00,
    cacheReadPerMillion: 0.50,
    cacheCreatePerMillion: 6.25,
  },
  sonnet: {
    inputPerMillion: 3.00,
    outputPerMillion: 15.00,
    cacheReadPerMillion: 0.30,
    cacheCreatePerMillion: 3.75,
  },
  haiku: {
    inputPerMillion: 1.00,
    outputPerMillion: 5.00,
    cacheReadPerMillion: 0.10,
    cacheCreatePerMillion: 1.25,
  },
};

export class ClaudePricingProvider implements IPricingProvider {
  readonly currency = USD;
  readonly defaultModelName = 'claude-sonnet-4';

  getPricing(modelName: string): TokenPricing {
    const m = modelName.toLowerCase();
    if (m.includes('opus')) return DEFAULT_CLAUDE_PRICING.opus;
    if (m.includes('haiku')) return DEFAULT_CLAUDE_PRICING.haiku;
    // Default to sonnet pricing for anything else (including 'sonnet' and unknown models)
    return DEFAULT_CLAUDE_PRICING.sonnet;
  }

  calculateCost(usage: TokenUsage, pricing: TokenPricing): number {
    const inputCost = (usage.inputOther * pricing.inputPerMillion) / 1_000_000;
    const outputCost = (usage.output * pricing.outputPerMillion) / 1_000_000;
    const cacheReadCost = (usage.inputCacheRead * pricing.cacheReadPerMillion) / 1_000_000;
    const cacheCreateCost = (usage.inputCacheCreation * pricing.cacheCreatePerMillion) / 1_000_000;
    return inputCost + outputCost + cacheReadCost + cacheCreateCost;
  }
}
