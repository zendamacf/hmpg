import { beforeEach, describe, expect, it, vi } from 'vitest';

const unsplashGet = vi.fn();

vi.mock('$env/dynamic/private', () => ({
  env: { UNSPLASH_ACCESS_KEY: 'test-key' },
}));

vi.mock('unsplash-js', () => ({
  createApi: () => ({
    GET: unsplashGet,
  }),
}));

const { UnsplashAPI } = await import('./unsplash');

const photoWithCoords = {
  id: 'photo-1',
  urls: { full: 'https://example.com/full.jpg', regular: 'https://example.com/regular.jpg' },
  user: {
    name: 'Jane Doe',
    first_name: 'Jane',
    last_name: 'Doe',
    social: { instagram_username: 'janedoe' },
  },
  location: {
    name: 'Yosemite',
    position: { latitude: 37.8651, longitude: -119.5383 },
  },
};

describe('UnsplashAPI.getRandom', () => {
  beforeEach(() => {
    unsplashGet.mockReset();
  });

  it('maps a photo that has coordinates', async () => {
    unsplashGet.mockResolvedValue({ data: [photoWithCoords] });

    const result = await UnsplashAPI.getRandom(['landscape', 'mountain']);

    expect(unsplashGet).toHaveBeenCalledWith('/photos/random', {
      params: {
        query: {
          query: expect.stringMatching(/^(landscape|mountain)$/),
          orientation: 'landscape',
          count: 30,
        },
      },
    });
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
    unsplashGet.mockResolvedValue({
      data: [
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

  it('maps a single-photo response', async () => {
    unsplashGet.mockResolvedValue({ data: photoWithCoords });

    const result = await UnsplashAPI.getRandom(['city']);

    expect(result.id).toBe('photo-1');
    expect(result.location.latitude).toBe(37.8651);
  });

  it('throws when the API returns an error', async () => {
    unsplashGet.mockResolvedValue({ data: undefined, error: { errors: ['rate limit'] } });

    await expect(UnsplashAPI.getRandom(['city'])).rejects.toThrow(
      'Unexpected response from Unsplash',
    );
  });

  it('maps null location and instagram fields', async () => {
    unsplashGet.mockResolvedValue({
      data: [
        {
          ...photoWithCoords,
          location: {
            name: null,
            position: { latitude: 1, longitude: 2 },
          },
          user: {
            ...photoWithCoords.user,
            social: { instagram_username: null },
          },
        },
      ],
    });

    const result = await UnsplashAPI.getRandom(['landscape']);

    expect(result.location).toEqual({
      name: null,
      latitude: 1,
      longitude: 2,
    });
    expect(result.author.instagram).toBeNull();
  });
});
