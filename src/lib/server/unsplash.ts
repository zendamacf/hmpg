import { type AssetFull, createApi } from 'unsplash-js';
import { env } from '$env/dynamic/private';

if (!env.UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY is not set');

const unsplash = createApi({ accessKey: env.UNSPLASH_ACCESS_KEY });

interface UnsplashImage {
  id: string;
  urls: {
    full: string;
    regular: string;
  };
  author: {
    name: string;
    instagram: string | null;
  };
  location: {
    name: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

const getRandom = async (tags: string[]): Promise<UnsplashImage> => {
  const { data, error } = await unsplash.GET('/photos/random', {
    params: {
      query: {
        query: tags[Math.floor(Math.random() * tags.length)],
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
    urls: {
      full: raw.urls.full,
      regular: raw.urls.regular,
    },
    author: {
      name: raw.user.name,
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
