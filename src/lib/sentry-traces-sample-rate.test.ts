import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ dev: false }));

describe('tracesSampleRate', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('$app/env/public');
  });

  it('defaults to 0.1 in production when unset', async () => {
    vi.doMock('$app/env/public', () => ({ PUBLIC_SENTRY_TRACES_SAMPLE_RATE: '' }));

    const { tracesSampleRate } = await import('./sentry-traces-sample-rate');
    expect(tracesSampleRate()).toBe(0.1);
  });

  it('uses PUBLIC_SENTRY_TRACES_SAMPLE_RATE when valid', async () => {
    vi.doMock('$app/env/public', () => ({ PUBLIC_SENTRY_TRACES_SAMPLE_RATE: '0.25' }));

    const { tracesSampleRate } = await import('./sentry-traces-sample-rate');
    expect(tracesSampleRate()).toBe(0.25);
  });

  it('falls back when the env value is invalid', async () => {
    vi.doMock('$app/env/public', () => ({ PUBLIC_SENTRY_TRACES_SAMPLE_RATE: 'not-a-number' }));

    const { tracesSampleRate } = await import('./sentry-traces-sample-rate');
    expect(tracesSampleRate()).toBe(0.1);
  });
});
