import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    limit.mockReset();
    refreshImage.mockReset();
    refreshImage.mockResolvedValue(undefined);
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
      unsplashid: 'photo-1',
    };
    limit.mockResolvedValue([photo]);

    await expect(load(loadEvent)).resolves.toEqual(photo);
    expect(limit).toHaveBeenCalledWith(1);
    expect(refreshImage).not.toHaveBeenCalled();
  });

  it('refreshes and returns undefined when the database stays empty', async () => {
    limit.mockResolvedValue([]);

    await expect(load(loadEvent)).resolves.toBeUndefined();
    expect(refreshImage).toHaveBeenCalledWith('page-load');
  });
});
