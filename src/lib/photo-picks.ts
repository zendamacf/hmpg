/** Photo data the browser needs to show a photo after the server pruned it. */
export type PickedPhoto = {
  id: number;
  unsplash_id: string | null;
  latitude: string | null;
  longitude: string | null;
  location: string | null;
  author_name: string | null;
  author_username: string | null;
  author_instagram: string | null;
  url: string | null;
};

export type PhotoPicks = {
  pinned: PickedPhoto | null;
  favorites: PickedPhoto[];
};

export const emptyPicks: PhotoPicks = { pinned: null, favorites: [] };

/** Chance that a page load shows a favorite instead of the server photo. */
export const FAVORITE_CHANCE = 0.3;

const STORAGE_KEY = 'hmpg:photo-picks';

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isPickedPhoto = (value: unknown): value is PickedPhoto => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const photo = value as Record<string, unknown>;
  return (
    typeof photo.id === 'number' &&
    isNullableString(photo.unsplash_id) &&
    isNullableString(photo.latitude) &&
    isNullableString(photo.longitude) &&
    isNullableString(photo.location) &&
    isNullableString(photo.author_name) &&
    isNullableString(photo.author_username) &&
    isNullableString(photo.author_instagram) &&
    isNullableString(photo.url)
  );
};

export const parsePicks = (raw: string | null): PhotoPicks => {
  if (!raw) {
    return emptyPicks;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof PhotoPicks, unknown>>;
    return {
      pinned: isPickedPhoto(parsed.pinned) ? parsed.pinned : null,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter(isPickedPhoto) : [],
    };
  } catch {
    return emptyPicks;
  }
};

export const loadPicks = (): PhotoPicks => {
  if (typeof localStorage === 'undefined') {
    return emptyPicks;
  }
  return parsePicks(localStorage.getItem(STORAGE_KEY));
};

export const savePicks = (picks: PhotoPicks): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
};

export const isPinned = (picks: PhotoPicks, photo: PickedPhoto): boolean =>
  picks.pinned?.id === photo.id;

export const isFavorite = (picks: PhotoPicks, photo: PickedPhoto): boolean =>
  picks.favorites.some((favorite) => favorite.id === photo.id);

/** Pin the photo, or unpin it when it is already pinned. */
export const togglePin = (picks: PhotoPicks, photo: PickedPhoto): PhotoPicks => ({
  ...picks,
  pinned: isPinned(picks, photo) ? null : photo,
});

/** Add the photo to the favorites, or remove it when it is already a favorite. */
export const toggleFavorite = (picks: PhotoPicks, photo: PickedPhoto): PhotoPicks => ({
  ...picks,
  favorites: isFavorite(picks, photo)
    ? picks.favorites.filter((favorite) => favorite.id !== photo.id)
    : [...picks.favorites, photo],
});

/**
 * Choose the photo to show. A pinned photo always wins. Otherwise a favorite
 * replaces the server photo some of the time, so other photos still appear.
 */
export const choosePhoto = (
  serverPhoto: PickedPhoto | null,
  picks: PhotoPicks,
  random: () => number = Math.random,
): PickedPhoto | null => {
  if (picks.pinned) {
    return picks.pinned;
  }
  if (picks.favorites.length > 0 && (serverPhoto === null || random() < FAVORITE_CHANCE)) {
    return picks.favorites[Math.floor(random() * picks.favorites.length)];
  }
  return serverPhoto;
};
