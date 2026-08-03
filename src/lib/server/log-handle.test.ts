import type { RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();

vi.mock('$lib/server/logger', () => ({
  logger: { info, warn, error, debug: vi.fn() },
}));

const { logHandle } = await import('./log-handle');

const makeEvent = (pathname: string) =>
  ({
    url: new URL(`http://localhost${pathname}`),
    request: new Request(`http://localhost${pathname}`),
  }) as unknown as RequestEvent;

describe('logHandle', () => {
  beforeEach(() => {
    info.mockReset();
    warn.mockReset();
    error.mockReset();
  });

  it('skips logging for /health', async () => {
    const response = await logHandle({
      event: makeEvent('/health'),
      resolve: async () => new Response('ok', { status: 200 }),
    });

    expect(await response.text()).toBe('ok');
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('logs info for successful requests', async () => {
    await logHandle({
      event: makeEvent('/'),
      resolve: async () => new Response(null, { status: 200 }),
    });

    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/',
        status: 200,
        durationMs: expect.any(Number),
      }),
      'request',
    );
  });

  it('logs warn for 4xx responses', async () => {
    await logHandle({
      event: makeEvent('/refresh'),
      resolve: async () => new Response(null, { status: 401 }),
    });

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/refresh', status: 401 }),
      'request',
    );
  });

  it('logs error for 5xx responses', async () => {
    await logHandle({
      event: makeEvent('/'),
      resolve: async () => new Response(null, { status: 500 }),
    });

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/', status: 500 }),
      'request',
    );
  });
});
