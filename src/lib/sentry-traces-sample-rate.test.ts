import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
  dev: false,
}));

vi.mock('$env/dynamic/public', () => ({
  env: {} as Record<string, string | undefined>,
}));

describe('tracesSampleRate', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to 0.1 in production when unset', async () => {
    const { env } = await import('$env/dynamic/public');
    delete env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE;

    const { tracesSampleRate } = await import('./sentry-traces-sample-rate');
    expect(tracesSampleRate()).toBe(0.1);
  });

  it('uses PUBLIC_SENTRY_TRACES_SAMPLE_RATE when valid', async () => {
    const { env } = await import('$env/dynamic/public');
    env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE = '0.25';

    const { tracesSampleRate } = await import('./sentry-traces-sample-rate');
    expect(tracesSampleRate()).toBe(0.25);
  });

  it('falls back when the env value is invalid', async () => {
    const { env } = await import('$env/dynamic/public');
    env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE = 'not-a-number';

    const { tracesSampleRate } = await import('./sentry-traces-sample-rate');
    expect(tracesSampleRate()).toBe(0.1);
  });
});
