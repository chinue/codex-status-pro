// DESIGN: v2-provider-abstraction.md#claude-api
// AGENTS: err->try-catch | network-fallback
// 🔀 Provider boundary: Anthropic API rate-limit headers

import fetch from 'node-fetch';
import { IQuotaApiProvider, ApiResult, UnifiedQuota } from '../base/types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export class QuotaExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExhaustedError';
  }
}

export class ClaudeApiProvider implements IQuotaApiProvider {
  async fetchQuota(token: string): Promise<ApiResult> {
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'oauth-2025-04-20',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: '.' }],
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        if (response.status === 403) {
          return { ok: false, error: `Quota exhausted: ${bodyText}`, authFailed: true };
        }
        if (response.status === 401) {
          return { ok: false, error: `HTTP ${response.status}: ${bodyText}`, authFailed: true };
        }
        return { ok: false, error: `Anthropic API returned ${response.status}: ${bodyText}` };
      }

      const data = this.parseHeaders(response.headers);
      return { ok: true, data };
    } catch (err) {
      const msg = (err as Error).message;
      const isNetwork = /fetch|network|ECONN|ENOTFOUND|ETIMEDOUT/i.test(msg);
      return { ok: false, error: msg, networkError: isNetwork };
    }
  }

  private parseHeaders(headers: any): UnifiedQuota {
    const util5hRaw = String(headers.get('anthropic-ratelimit-unified-5h-utilization') ?? '0');
    const util7dRaw = String(headers.get('anthropic-ratelimit-unified-7d-utilization') ?? '0');
    const reset5hStr = headers.get('anthropic-ratelimit-unified-5h-reset');
    const reset7dStr = headers.get('anthropic-ratelimit-unified-7d-reset');
    const status5h = headers.get('anthropic-ratelimit-unified-5h-status');

    const clamp01 = (n: number) => (!isFinite(n) ? 0 : Math.max(0, Math.min(1, n)));
    const util5h = clamp01(parseFloat(util5hRaw));
    const util7d = clamp01(parseFloat(util7dRaw));

    const nowSec = Date.now() / 1000;
    const resetIn5h = reset5hStr ? Math.max(0, parseInt(reset5hStr, 10) - nowSec) : 0;
    const resetIn7d = reset7dStr ? Math.max(0, parseInt(reset7dStr, 10) - nowSec) : 0;

    let limitStatus: 'allowed' | 'allowed_warning' | 'denied';
    if (status5h === 'denied') {
      limitStatus = 'denied';
    } else if (util5h >= 0.75) {
      limitStatus = 'allowed_warning';
    } else {
      limitStatus = 'allowed';
    }

    const windowUsedPct = util5h * 100;
    const weeklyUsedPct = util7d * 100;

    return {
      weeklyLimit: 100,
      weeklyUsed: weeklyUsedPct,
      weeklyUsedPct,
      weeklyResetAt: Date.now() + resetIn7d * 1000,
      windowLimit: 100,
      windowUsed: windowUsedPct,
      windowRemaining: Math.max(0, 100 - windowUsedPct),
      windowUsedPct,
      windowResetAt: Date.now() + resetIn5h * 1000,
      parallelLimit: 0,
    };
  }
}
