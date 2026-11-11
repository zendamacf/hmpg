import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Each query is a chain that can be awaited at any step. `results` holds what the
// next queries return, in the order the page asks for them.
const calls = {
  limit: vi.fn(),
  selectDistinct: vi.fn(),
  inArray: vi.fn(),
};
const photoResults: unknown[][] = [];
const topicResults: unknown[][] = [];
const refreshImage = vi.fn();

const chain = (next: () => unknown[]) => {
  const query: Record<string, unknown> = {};
  for (const name of ['from', 'orderBy', 'groupBy']) {
    query[name] = vi.fn(() => query);
  }
  query.where = vi.fn(() => query);
  query.limit = vi.fn((count: number) => {
    calls.limit(count);
    return Promise.resolve(next());
  });
  query.then = (resolve: (rows: unknown[]) => unknown) => Promise.resolve(next()).then(resolve);
  return query;
};

// Record which topics the page filters by. Everything else in drizzle-orm stays real.
vi.mock('drizzle-orm', async (importOriginal) => {
  const original = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...original,
    inArray: (column: unknown, values: unknown) => {
      calls.inArray(values);
      return original.inArray(column as never, values as never);
    },
  };
});

vi.mock('#lib/server/db/index.js', () => ({
  db: {
    select: vi.fn(() => chain(() => photoResults.shift() ?? [])),
    selectDistinct: vi.fn((fields: unknown) => {
      calls.selectDistinct(fields);
      return chain(() => topicResults.shift() ?? []);
    }),
  },
}));

vi.mock('#lib/server/refresh-image.js', () => ({
  refreshImage,
}));

vi.mock('#lib/server/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { load } = await import('./+page.server');

const eventWith = (cookie?: string) =>
  ({
    cookies: { get: (name: string) => (name === 'hmpg-topics' ? cookie : undefined) },
  }) as unknown as Parameters<typeof load>[0];

const photo = {
  id: 1,
  url: 'https://example.com/photo.jpg',
  latitude: '37.8651',
  longitude: '-119.5383',
  location: 'Yosemite',
  author_name: 'Jane Doe',
  author_instagram: 'janedoe',
  unsplash_id: 'photo-1',
  tag: 'mountain',
};

describe('+page.server load', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    calls.inArray.mockReset();
    calls.limit.mockReset();
    calls.selectDistinct.mockReset();
    photoResults.length = 0;
    topicResults.length = 0;
    refreshImage.mockReset();
    refreshImage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a random image and the topics in the pool', async () => {
    topicResults.push([{ tag: 'mountain' }, { tag: 'snow' }]);
    photoResults.push([photo]);

    await expect(load(eventWith())).resolves.toEqual({ photo, topics: ['mountain', 'snow'] });
    expect(calls.limit).toHaveBeenCalledWith(1);
    expect(calls.inArray).not.toHaveBeenCalled();
    expect(refreshImage).not.toHaveBeenCalled();
  });

  it('lists only photos that have a tag as topics', async () => {
    topicResults.push([{ tag: 'beach' }, { tag: null }]);
    photoResults.push([photo]);

    const result = await load(eventWith());

    expect(result).toMatchObject({ topics: ['beach'] });
    expect(calls.selectDistinct).toHaveBeenCalledTimes(1);
  });

  describe('topic filter', () => {
    it('picks from the chosen topics', async () => {
      topicResults.push([{ tag: 'mountain' }, { tag: 'snow' }]);
      photoResults.push([photo]);

      const result = await load(eventWith('snow,mountain'));

      expect(result).toEqual({ photo, topics: ['mountain', 'snow'] });
      // One query for the chosen topics, and it found a photo.
      expect(calls.inArray).toHaveBeenCalledTimes(1);
      expect(calls.inArray).toHaveBeenCalledWith(['snow', 'mountain']);
      expect(calls.limit).toHaveBeenCalledTimes(1);
    });

    it('uses any photo when no photo matches the chosen topics', async () => {
      const other = { ...photo, id: 2, tag: 'city' };
      topicResults.push([{ tag: 'mountain' }, { tag: 'snow' }]);
      photoResults.push([], [other]);

      const result = await load(eventWith('snow'));

      expect(result).toEqual({ photo: other, topics: ['mountain', 'snow'] });
      expect(calls.inArray).toHaveBeenCalledTimes(1);
      expect(calls.limit).toHaveBeenCalledTimes(2);
      expect(refreshImage).not.toHaveBeenCalled();
    });

    it('ignores topics that are not in the pool', async () => {
      topicResults.push([{ tag: 'mountain' }]);
      photoResults.push([photo]);

      await load(eventWith('volcano'));

      // The chosen topic is not a tag in the pool, so there is no filter.
      expect(calls.inArray).not.toHaveBeenCalled();
      expect(calls.limit).toHaveBeenCalledTimes(1);
    });

    it('ignores invalid cookie values', async () => {
      topicResults.push([{ tag: 'mountain' }]);
      photoResults.push([photo]);

      await expect(load(eventWith("mountain'; drop table image;--"))).resolves.toMatchObject({
        photo,
      });
      expect(calls.inArray).not.toHaveBeenCalled();
      expect(calls.limit).toHaveBeenCalledTimes(1);
    });

    it('only filters by topics that are valid and in the pool', async () => {
      topicResults.push([{ tag: 'mountain' }, { tag: 'snow' }]);
      photoResults.push([photo]);

      await load(eventWith("snow,volcano,x'; --,mountain"));

      expect(calls.inArray).toHaveBeenCalledWith(['snow', 'mountain']);
    });

    it('ignores a damaged cookie', async () => {
      topicResults.push([{ tag: 'mountain' }]);
      photoResults.push([photo]);

      await expect(load(eventWith('%E0%A4%A'))).resolves.toMatchObject({ photo });
      expect(calls.inArray).not.toHaveBeenCalled();
    });
  });

  it('retries refresh and returns null when the database stays empty', async () => {
    const resultPromise = load(eventWith());
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({ photo: null, topics: [] });
    expect(refreshImage).toHaveBeenCalledTimes(3);
    expect(refreshImage).toHaveBeenCalledWith('page-load');
  });

  it('returns a photo, and the new topics, after a later refresh attempt succeeds', async () => {
    const second = { ...photo, id: 2, unsplash_id: 'photo-2', tag: 'city' };
    topicResults.push([], [{ tag: 'city' }]);
    // First load, first refresh attempt, then second attempt finds a photo.
    photoResults.push([], [], [second]);

    const resultPromise = load(eventWith());
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({ photo: second, topics: ['city'] });
    expect(refreshImage).toHaveBeenCalledTimes(2);
  });
});
