import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

const DEFAULT_PRODUCTION_TRACES_SAMPLE_RATE = 0.1;

export const tracesSampleRate = (): number => {
  if (dev) {
    return 1.0;
  }

  const configured = env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  if (configured === undefined || configured === '') {
    return DEFAULT_PRODUCTION_TRACES_SAMPLE_RATE;
  }

  const parsed = Number.parseFloat(configured);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
    return DEFAULT_PRODUCTION_TRACES_SAMPLE_RATE;
  }

  return parsed;
};
