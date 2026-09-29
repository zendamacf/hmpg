import { afterEach, describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimits } from './rate-limit';

describe('checkRateLimit', () => {
  afterEach(() => {
    resetRateLimits();
  });

  it('allows requests under the limit', () => {
    const options = { windowMs: 60_000, max: 2 };

    expect(checkRateLimit('cron', options, 0).allowed).toBe(true);
    expect(checkRateLimit('cron', options, 1_000).allowed).toBe(true);
    expect(checkRateLimit('cron', options, 2_000).allowed).toBe(false);
  });

  it('expires old timestamps outside the window', () => {
    const options = { windowMs: 10_000, max: 1 };

    expect(checkRateLimit('cron', options, 0).allowed).toBe(true);
    expect(checkRateLimit('cron', options, 5_000).allowed).toBe(false);
    expect(checkRateLimit('cron', options, 11_000).allowed).toBe(true);
  });
});
