import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const limit = vi.fn();
const refreshImage = vi.fn();

vi.mock('$lib/server/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit,
        })),
      })),
    })),
  },
}));

vi.mock('$lib/server/refresh-image', () => ({
  refreshImage,
}));

vi.mock('$lib/server/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { load } = await import('./+page.server');

const loadEvent = {} as Parameters<typeof load>[0];

describe('+page.server load', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    limit.mockReset();
    refreshImage.mockReset();
    refreshImage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a random image from the database', async () => {
    const photo = {
      id: 1,
      url: 'https://example.com/photo.jpg',
      latitude: '37.8651',
      longitude: '-119.5383',
      location: 'Yosemite',
      author_name: 'Jane Doe',
      author_instagram: 'janedoe',
      unsplash_id: 'photo-1',
    };
    limit.mockResolvedValue([photo]);

    await expect(load(loadEvent)).resolves.toEqual({ photo });
    expect(limit).toHaveBeenCalledWith(1);
    expect(refreshImage).not.toHaveBeenCalled();
  });

  it('retries refresh and returns null when the database stays empty', async () => {
    limit.mockResolvedValue([]);

    const resultPromise = load(loadEvent);
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toEqual({ photo: null });
    expect(refreshImage).toHaveBeenCalledTimes(3);
    expect(refreshImage).toHaveBeenCalledWith('page-load');
  });

  it('returns a photo after a later refresh attempt succeeds', async () => {
    const photo = {
      id: 2,
      url: 'https://example.com/photo-2.jpg',
      latitude: '0',
      longitude: '0',
      location: 'Test',
      author_name: 'Author',
      author_instagram: null,
      unsplash_id: 'photo-2',
    };
    limit.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([photo]);

    const resultPromise = load(loadEvent);
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toEqual({ photo });
    expect(refreshImage).toHaveBeenCalledTimes(2);
  });
});
