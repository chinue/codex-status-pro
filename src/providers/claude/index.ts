// DESIGN: v2-provider-abstraction.md#claude-provider
// AGENTS: keep-minimal

import { IProvider } from '../base/types';
import { ClaudeAuthProvider } from './auth';
import { ClaudeApiProvider } from './api';
import { ClaudeLocalParser } from './localParser';
import { ClaudePricingProvider } from './pricing';
import { claudeUIProvider } from './ui';

export function createClaudeProvider(): IProvider {
  return {
    id: 'claude',
    displayName: 'Claude',
    currency: { code: 'USD', symbol: '$' },
    auth: new ClaudeAuthProvider(),
    api: new ClaudeApiProvider(),
    localUsage: new ClaudeLocalParser(),
    pricing: new ClaudePricingProvider(),
    ui: claudeUIProvider,
  };
}
