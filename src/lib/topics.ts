/** Cookie that mirrors the chosen topics, so the server can filter the first photo. */
export const TOPICS_COOKIE = 'hmpg-topics';

const MAX_TOPICS = 50;
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

// Topics are tags from the `image` table, which come from our own search keywords.
// This pattern is a second check: it only lets plain words through.
const TOPIC_PATTERN = /^[a-z0-9][a-z0-9 -]{0,39}$/;

/** Keeps valid, unique topic names. Anything else is dropped. */
export const normalizeTopics = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const topics = new Set<string>();
  for (const item of value) {
    if (typeof item === 'string' && TOPIC_PATTERN.test(item)) {
      topics.add(item);
    }
    if (topics.size >= MAX_TOPICS) {
      break;
    }
  }
  return [...topics];
};

export const topicLabel = (tag: string): string => tag.charAt(0).toUpperCase() + tag.slice(1);

/** Adds the topic, or removes it when it is already chosen. */
export const toggleTopic = (selected: readonly string[], tag: string): string[] =>
  selected.includes(tag) ? selected.filter((topic) => topic !== tag) : [...selected, tag];

/** The chosen topics that exist in the pool right now. */
export const activeTopics = (selected: readonly string[], available: readonly string[]): string[] =>
  selected.filter((topic) => available.includes(topic));

/** Reads the cookie value. Bad or damaged values give an empty list. */
export const parseTopicsCookie = (raw: string | null | undefined): string[] => {
  if (!raw) {
    return [];
  }
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return [];
  }
  return normalizeTopics(decoded.split(','));
};

/** The `document.cookie` string for the chosen topics. An empty list removes the cookie. */
export const topicsCookieString = (topics: readonly string[]): string => {
  const value = encodeURIComponent(normalizeTopics([...topics]).join(','));
  const maxAge = value === '' ? 0 : ONE_YEAR_SECONDS;
  return `${TOPICS_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

/** Finds the topics in a `document.cookie` string. */
export const readTopicsCookie = (cookieHeader: string): string[] => {
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === TOPICS_COOKIE) {
      return parseTopicsCookie(rest.join('='));
    }
  }
  return [];
};

export const sameTopics = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((topic) => b.includes(topic));
