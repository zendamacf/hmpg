import { describe, expect, it } from 'vitest';
import {
  activeTopics,
  normalizeTopics,
  parseTopicsCookie,
  readTopicsCookie,
  sameTopics,
  TOPICS_COOKIE,
  toggleTopic,
  topicLabel,
  topicsCookieString,
} from './topics';

describe('normalizeTopics', () => {
  it('keeps plain lowercase topic names', () => {
    expect(normalizeTopics(['landscape', 'night sky', 'sci-fi', 'b2b'])).toEqual([
      'landscape',
      'night sky',
      'sci-fi',
      'b2b',
    ]);
  });

  it('removes duplicates and keeps the order', () => {
    expect(normalizeTopics(['snow', 'city', 'snow'])).toEqual(['snow', 'city']);
  });

  it.each([
    ['not an array', 'snow'],
    ['null', null],
    ['an object', { snow: true }],
  ])('returns nothing for %s', (_name, value) => {
    expect(normalizeTopics(value)).toEqual([]);
  });

  it('drops values that are not plain words', () => {
    expect(
      normalizeTopics([
        42,
        null,
        '',
        ' snow',
        'Snow',
        'snow,city',
        "x'; drop table image;--",
        '<script>',
        '-dash',
        'a'.repeat(41),
        'ok',
      ]),
    ).toEqual(['ok']);
  });

  it('limits the number of topics', () => {
    const many = Array.from({ length: 80 }, (_, index) => `topic${index}`);
    expect(normalizeTopics(many)).toHaveLength(50);
  });
});

describe('topicLabel', () => {
  it('capitalizes the first letter', () => {
    expect(topicLabel('landscape')).toBe('Landscape');
    expect(topicLabel('night sky')).toBe('Night sky');
    expect(topicLabel('')).toBe('');
  });
});

describe('toggleTopic', () => {
  it('adds a topic that is not chosen', () => {
    expect(toggleTopic(['snow'], 'city')).toEqual(['snow', 'city']);
  });

  it('removes a topic that is chosen', () => {
    expect(toggleTopic(['snow', 'city'], 'snow')).toEqual(['city']);
  });
});

describe('activeTopics', () => {
  it('keeps only the chosen topics that are in the pool', () => {
    expect(activeTopics(['snow', 'volcano'], ['city', 'snow'])).toEqual(['snow']);
    expect(activeTopics([], ['city'])).toEqual([]);
    expect(activeTopics(['snow'], [])).toEqual([]);
  });
});

describe('parseTopicsCookie', () => {
  it('reads a list of topics', () => {
    expect(parseTopicsCookie('snow,city')).toEqual(['snow', 'city']);
    expect(parseTopicsCookie(encodeURIComponent('night sky,snow'))).toEqual(['night sky', 'snow']);
  });

  it('returns nothing for missing, empty or damaged values', () => {
    expect(parseTopicsCookie(undefined)).toEqual([]);
    expect(parseTopicsCookie(null)).toEqual([]);
    expect(parseTopicsCookie('')).toEqual([]);
    expect(parseTopicsCookie('%E0%A4%A')).toEqual([]);
  });

  it('drops values that are not plain words', () => {
    expect(parseTopicsCookie("snow,x'; drop table image;--,<b>")).toEqual(['snow']);
  });
});

describe('topicsCookieString', () => {
  it('writes a year-long cookie for the whole site', () => {
    expect(topicsCookieString(['snow', 'night sky'])).toBe(
      `${TOPICS_COOKIE}=snow%2Cnight%20sky; path=/; max-age=31536000; SameSite=Lax`,
    );
  });

  it('removes the cookie when there are no topics', () => {
    expect(topicsCookieString([])).toBe(`${TOPICS_COOKIE}=; path=/; max-age=0; SameSite=Lax`);
  });

  it('never writes invalid topics', () => {
    expect(topicsCookieString(['snow;', 'city'])).toContain('=city;');
  });

  it('round trips through the reader', () => {
    const header = `a=1; ${topicsCookieString(['snow', 'night sky']).split(';')[0]}; b=2`;
    expect(readTopicsCookie(header)).toEqual(['snow', 'night sky']);
  });
});

describe('readTopicsCookie', () => {
  it('finds the topics among other cookies', () => {
    expect(readTopicsCookie(`theme=dark; ${TOPICS_COOKIE}=snow%2Ccity; other=x`)).toEqual([
      'snow',
      'city',
    ]);
  });

  it('returns nothing when the cookie is missing', () => {
    expect(readTopicsCookie('')).toEqual([]);
    expect(readTopicsCookie('theme=dark')).toEqual([]);
    expect(readTopicsCookie('xhmpg-topics=snow')).toEqual([]);
  });
});

describe('sameTopics', () => {
  it('ignores order', () => {
    expect(sameTopics(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameTopics([], [])).toBe(true);
  });

  it('notices different lists', () => {
    expect(sameTopics(['a'], ['a', 'b'])).toBe(false);
    expect(sameTopics(['a', 'c'], ['a', 'b'])).toBe(false);
  });
});
