import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  choosePhoto,
  emptyPicks,
  FAVORITE_CHANCE,
  isFavorite,
  isPinned,
  loadPicks,
  type PickedPhoto,
  parsePicks,
  savePicks,
  toggleFavorite,
  togglePin,
} from './photo-picks';

const makePhoto = (id: number): PickedPhoto => ({
  id,
  unsplash_id: `photo-${id}`,
  latitude: '1',
  longitude: '2',
  location: 'Somewhere',
  author_name: 'Jane Doe',
  author_username: 'jane',
  author_instagram: null,
  url: `https://example.com/${id}.jpg`,
});

describe('parsePicks', () => {
  it('returns empty picks for missing or invalid JSON', () => {
    expect(parsePicks(null)).toEqual(emptyPicks);
    expect(parsePicks('{not json')).toEqual(emptyPicks);
  });

  it('keeps valid photos and drops invalid ones', () => {
    const raw = JSON.stringify({
      pinned: makePhoto(1),
      favorites: [makePhoto(2), { id: 'x' }, null],
    });
    expect(parsePicks(raw)).toEqual({ pinned: makePhoto(1), favorites: [makePhoto(2)] });
  });

  it('ignores fields of the wrong type', () => {
    expect(parsePicks(JSON.stringify({ pinned: 4, favorites: 'a' }))).toEqual(emptyPicks);
  });
});

describe('toggles', () => {
  it('pins and unpins a photo', () => {
    const pinned = togglePin(emptyPicks, makePhoto(1));
    expect(isPinned(pinned, makePhoto(1))).toBe(true);
    expect(isPinned(pinned, makePhoto(2))).toBe(false);
    expect(togglePin(pinned, makePhoto(1)).pinned).toBeNull();
  });

  it('replaces the pin when another photo is pinned', () => {
    const pinned = togglePin(togglePin(emptyPicks, makePhoto(1)), makePhoto(2));
    expect(pinned.pinned?.id).toBe(2);
  });

  it('adds and removes favorites', () => {
    const one = toggleFavorite(emptyPicks, makePhoto(1));
    const two = toggleFavorite(one, makePhoto(2));
    expect(two.favorites.map((photo) => photo.id)).toEqual([1, 2]);
    expect(isFavorite(two, makePhoto(2))).toBe(true);
    expect(toggleFavorite(two, makePhoto(1)).favorites.map((photo) => photo.id)).toEqual([2]);
  });

  it('keeps the pin when a favorite changes', () => {
    const picks = toggleFavorite(togglePin(emptyPicks, makePhoto(1)), makePhoto(2));
    expect(picks.pinned?.id).toBe(1);
  });
});

describe('choosePhoto', () => {
  const server = makePhoto(10);

  it('returns the server photo when nothing is picked', () => {
    expect(choosePhoto(server, emptyPicks, () => 0)).toBe(server);
    expect(choosePhoto(null, emptyPicks, () => 0)).toBeNull();
  });

  it('always returns the pinned photo, even after the pool is pruned', () => {
    const picks = togglePin(toggleFavorite(emptyPicks, makePhoto(2)), makePhoto(1));
    expect(choosePhoto(server, picks, () => 0)).toEqual(makePhoto(1));
    expect(choosePhoto(null, picks, () => 0.99)).toEqual(makePhoto(1));
  });

  it('shows a favorite with the favorite chance and the server photo otherwise', () => {
    const picks = toggleFavorite(toggleFavorite(emptyPicks, makePhoto(1)), makePhoto(2));
    const draws = [FAVORITE_CHANCE - 0.01, 0.9];
    expect(choosePhoto(server, picks, () => draws.shift() ?? 0)).toEqual(makePhoto(2));
    expect(choosePhoto(server, picks, () => FAVORITE_CHANCE)).toBe(server);
  });

  it('shows a favorite when the server has no photo', () => {
    const picks = toggleFavorite(emptyPicks, makePhoto(3));
    expect(choosePhoto(null, picks, () => 0.99)).toEqual(makePhoto(3));
  });

  it('shows favorites more often than any other single photo', () => {
    const picks = toggleFavorite(emptyPicks, makePhoto(1));
    let favoriteShown = 0;
    const runs = 1000;
    for (let i = 0; i < runs; i++) {
      if (choosePhoto(server, picks)?.id === 1) {
        favoriteShown++;
      }
    }
    expect(favoriteShown / runs).toBeGreaterThan(0.2);
    expect(favoriteShown / runs).toBeLessThan(0.4);
  });
});

describe('storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and loads picks', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
    const picks = togglePin(toggleFavorite(emptyPicks, makePhoto(2)), makePhoto(1));
    savePicks(picks);
    expect(loadPicks()).toEqual(picks);
  });

  it('falls back to empty picks without localStorage', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadPicks()).toEqual(emptyPicks);
    expect(() => savePicks(emptyPicks)).not.toThrow();
  });
});
