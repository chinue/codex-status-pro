// DESIGN: v2-provider-abstraction.md#kimi-provider
// AGENTS: keep-minimal

import { IProvider } from '../base/types';
import { KimiAuthProvider } from './auth';
import { KimiApiProvider } from './api';
import { KimiLocalParser } from './localParser';
import { KimiPricingProvider } from './pricing';
import { kimiUIProvider } from './ui';

export function createKimiProvider(): IProvider {
  return {
    id: 'kimi',
    displayName: 'Kimi',
    currency: { code: 'CNY', symbol: '¥' },
    auth: new KimiAuthProvider(),
    api: new KimiApiProvider(),
    localUsage: new KimiLocalParser(),
    pricing: new KimiPricingProvider(),
    ui: kimiUIProvider,
  };
}
