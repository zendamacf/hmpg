import { beforeEach, describe, expect, it, vi } from 'vitest';

const limit = vi.fn();

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

const { load } = await import('./+page.server');

describe('+page.server load', () => {
  beforeEach(() => {
    limit.mockReset();
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

    await expect(load()).resolves.toEqual(photo);
    expect(limit).toHaveBeenCalledWith(1);
  });

  it('returns undefined when the database has no images', async () => {
    limit.mockResolvedValue([]);

    await expect(load()).resolves.toBeUndefined();
  });
});
