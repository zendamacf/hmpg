import { beforeEach, describe, expect, it, vi } from 'vitest';

const getRandom = vi.fn();
const onConflictDoNothing = vi.fn();
const values = vi.fn();
const insert = vi.fn();

vi.mock('$lib/server/unsplash', () => ({
  UnsplashAPI: { getRandom },
}));

vi.mock('$lib/server/db', () => ({
  db: {
    insert,
  },
}));

values.mockReturnValue({ onConflictDoNothing });
insert.mockReturnValue({ values });

const { GET } = await import('./+server');

const unsplashPhoto = {
  id: 'photo-1',
  urls: {
    full: 'https://example.com/full.jpg',
    regular: 'https://example.com/regular.jpg',
  },
  author: { name: 'Jane Doe', instagram: 'janedoe' },
  location: {
    name: 'Yosemite',
    latitude: 37.8651,
    longitude: -119.5383,
  },
};

describe('GET /refresh', () => {
  beforeEach(() => {
    getRandom.mockReset();
    values.mockClear();
    onConflictDoNothing.mockReset();
    onConflictDoNothing.mockResolvedValue(undefined);
    getRandom.mockResolvedValue(unsplashPhoto);
  });

  it('fetches from Unsplash and inserts into the database', async () => {
    const response = await GET();

    expect(getRandom).toHaveBeenCalledWith([
      'landscape',
      'water',
      'aerial',
      'places',
      'city',
      'sunset',
      'flowers',
      'snow',
      'temple',
      'mountain',
      'wanderlust',
    ]);
    expect(values).toHaveBeenCalledWith({
      unsplashid: 'photo-1',
      latitude: '37.8651',
      longitude: '-119.5383',
      location: 'Yosemite',
      author_name: 'Jane Doe',
      author_instagram: 'janedoe',
      url: 'https://example.com/full.jpg',
    });
    expect(onConflictDoNothing).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('stores null coordinates when the photo has none', async () => {
    getRandom.mockResolvedValue({
      ...unsplashPhoto,
      location: { name: null, latitude: null, longitude: null },
    });

    await GET();

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: undefined,
        longitude: undefined,
        location: null,
      }),
    );
  });
});
