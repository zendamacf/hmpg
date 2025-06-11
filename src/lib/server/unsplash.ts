import { env } from '$env/dynamic/private';
import { createApi } from 'unsplash-js';

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
  const resp = (
    await unsplash.photos.getRandom({
      query: tags[Math.floor(Math.random() * tags.length)],
      orientation: 'landscape',
      count: 30,
    })
  ).response;
  const raw = Array.isArray(resp) ? resp.find((r) => r.location.position.latitude) : undefined;
  if (!raw) throw new Error('No images found with coordinates');

  return {
    id: raw.id,
    urls: {
      full: raw.urls.full,
      regular: raw.urls.regular,
    },
    author: {
      name: `${raw.user.first_name} ${raw.user.last_name}`,
      instagram: raw.user.instagram_username,
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
