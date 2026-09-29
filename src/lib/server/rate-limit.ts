type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitState = {
  timestamps: number[];
};

const buckets = new Map<string, RateLimitState>();

export const checkRateLimit = (
  key: string,
  { windowMs, max }: RateLimitOptions,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } => {
  const state = buckets.get(key) ?? { timestamps: [] };
  const windowStart = now - windowMs;
  state.timestamps = state.timestamps.filter((timestamp) => timestamp > windowStart);

  if (state.timestamps.length >= max) {
    const oldest = state.timestamps[0] ?? now;
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    buckets.set(key, state);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  state.timestamps.push(now);
  buckets.set(key, state);
  return { allowed: true, retryAfterSeconds: 0 };
};

export const resetRateLimits = (): void => {
  buckets.clear();
};
