import { type AssetFull, createApi } from 'unsplash-js';
import { UNSPLASH_ACCESS_KEY } from '$app/env/private';

if (!UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY is not set');

const unsplash = createApi({ accessKey: UNSPLASH_ACCESS_KEY });

interface UnsplashImage {
  id: string;
  /** The search keyword that found the photo. */
  tag: string;
  urls: {
    full: string;
    regular: string;
  };
  author: {
    name: string;
    username: string;
    instagram: string | null;
  };
  location: {
    name: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

const getRandom = async (tags: readonly string[]): Promise<UnsplashImage> => {
  const tag = tags[Math.floor(Math.random() * tags.length)];
  const { data, error } = await unsplash.GET('/photos/random', {
    params: {
      query: {
        query: tag,
        orientation: 'landscape',
        count: 30,
      },
    },
  });

  if (error || data == null) {
    throw new Error('Unexpected response from Unsplash');
  }

  // Random endpoint returns a single photo or an array depending on count parameter
  // Handle both cases just in case
  const photos = (Array.isArray(data) ? data : [data]) as AssetFull[];
  const raw = photos.find((r) => r.location?.position?.latitude != null);
  if (!raw) throw new Error('No images found with coordinates');

  return {
    id: raw.id,
    tag,
    urls: {
      full: raw.urls.full,
      regular: raw.urls.regular,
    },
    author: {
      name: raw.user.name,
      username: raw.user.username,
      instagram: raw.user.social.instagram_username,
    },
    location: {
      name: raw.location.name,
      latitude: raw.location.position.latitude,
      longitude: raw.location.position.longitude,
    },
  };
};

export const UnsplashAPI = {
  getRandom,
};
