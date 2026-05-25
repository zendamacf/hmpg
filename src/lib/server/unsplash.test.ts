import { beforeEach, describe, expect, it, vi } from 'vitest';

const getRandom = vi.fn();

vi.mock('$env/dynamic/private', () => ({
  env: { UNSPLASH_ACCESS_KEY: 'test-key' },
}));

vi.mock('unsplash-js', () => ({
  createApi: () => ({
    photos: { getRandom },
  }),
}));

const { UnsplashAPI } = await import('./unsplash');

const photoWithCoords = {
  id: 'photo-1',
  urls: { full: 'https://example.com/full.jpg', regular: 'https://example.com/regular.jpg' },
  user: {
    first_name: 'Jane',
    last_name: 'Doe',
    instagram_username: 'janedoe',
  },
  location: {
    name: 'Yosemite',
    position: { latitude: 37.8651, longitude: -119.5383 },
  },
};

describe('UnsplashAPI.getRandom', () => {
  beforeEach(() => {
    getRandom.mockReset();
  });

  it('maps a photo that has coordinates', async () => {
    getRandom.mockResolvedValue({ response: [photoWithCoords] });

    const result = await UnsplashAPI.getRandom(['landscape', 'mountain']);

    expect(getRandom).toHaveBeenCalledWith(
      expect.objectContaining({
        orientation: 'landscape',
        count: 30,
        query: expect.stringMatching(/^(landscape|mountain)$/),
      }),
    );
    expect(result).toEqual({
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
    });
  });

  it('throws when no photos have coordinates', async () => {
    getRandom.mockResolvedValue({
      response: [
        {
          ...photoWithCoords,
          location: { ...photoWithCoords.location, position: { latitude: null, longitude: null } },
        },
      ],
    });

    await expect(UnsplashAPI.getRandom(['city'])).rejects.toThrow(
      'No images found with coordinates',
    );
  });
});
