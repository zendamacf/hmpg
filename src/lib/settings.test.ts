import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defaultUserSettings,
  loadUserSettings,
  parseUserSettings,
  saveUserSettings,
} from './settings';

describe('parseUserSettings', () => {
  it('returns defaults for missing or invalid JSON', () => {
    expect(parseUserSettings(null)).toEqual(defaultUserSettings);
    expect(parseUserSettings('{not json')).toEqual(defaultUserSettings);
  });

  it('merges partial valid settings with defaults', () => {
    expect(
      parseUserSettings(
        JSON.stringify({
          hour12: false,
          showLocation: false,
          showGreeting: false,
          showQuote: false,
        }),
      ),
    ).toEqual({
      ...defaultUserSettings,
      hour12: false,
      showLocation: false,
      showGreeting: false,
      showQuote: false,
    });
  });

  it('ignores invalid field types', () => {
    expect(
      parseUserSettings(
        JSON.stringify({
          hour12: 'yes',
          timezone: 42,
          showAttribution: 'on',
          showGreeting: 'yes',
          showQuote: 1,
          showWeather: 'yes',
          temperatureUnit: 'kelvin',
          weatherCity: { name: '', latitude: 1, longitude: 2 },
          topics: 'snow',
        }),
      ),
    ).toEqual(defaultUserSettings);
  });
});

describe('defaults', () => {
  it('shows the greeting and quote by default', () => {
    expect(defaultUserSettings.showGreeting).toBe(true);
    expect(defaultUserSettings.showQuote).toBe(true);
  });

  it('shows weather by default, with the unit and city unset', () => {
    expect(defaultUserSettings.showWeather).toBe(true);
    expect(defaultUserSettings.temperatureUnit).toBeNull();
    expect(defaultUserSettings.weatherCity).toBeNull();
  });
});

describe('topics setting', () => {
  it('has no topics by default', () => {
    expect(defaultUserSettings.topics).toEqual([]);
  });

  it('keeps valid topics', () => {
    expect(parseUserSettings(JSON.stringify({ topics: ['snow', 'night sky'] })).topics).toEqual([
      'snow',
      'night sky',
    ]);
  });

  it('drops topics that are not plain words, and duplicates', () => {
    expect(
      parseUserSettings(
        JSON.stringify({ topics: ['snow', 'snow', 42, null, "x'; --", 'Snow', '<b>', 'city'] }),
      ).topics,
    ).toEqual(['snow', 'city']);
  });

  it('ignores a value that is not a list', () => {
    expect(parseUserSettings(JSON.stringify({ topics: 'snow' })).topics).toEqual([]);
    expect(parseUserSettings(JSON.stringify({ topics: { snow: true } })).topics).toEqual([]);
  });
});

describe('weather settings', () => {
  const city = { name: 'Oslo, Norway', latitude: 59.91, longitude: 10.75 };

  it('keeps valid weather settings', () => {
    expect(
      parseUserSettings(
        JSON.stringify({ showWeather: false, temperatureUnit: 'fahrenheit', weatherCity: city }),
      ),
    ).toEqual({
      ...defaultUserSettings,
      showWeather: false,
      temperatureUnit: 'fahrenheit',
      weatherCity: city,
    });
  });

  it.each([
    ['null', null],
    ['text', 'Oslo'],
    ['missing name', { latitude: 1, longitude: 2 }],
    ['text latitude', { name: 'X', latitude: '1', longitude: 2 }],
    ['latitude out of range', { name: 'X', latitude: 91, longitude: 2 }],
    ['longitude out of range', { name: 'X', latitude: 1, longitude: 181 }],
    ['infinite longitude', { name: 'X', latitude: 1, longitude: null }],
  ])('drops a bad city: %s', (_name, weatherCity) => {
    expect(parseUserSettings(JSON.stringify({ weatherCity })).weatherCity).toBeNull();
  });

  it('removes extra fields from a saved city', () => {
    const parsed = parseUserSettings(JSON.stringify({ weatherCity: { ...city, extra: 'x' } }));
    expect(parsed.weatherCity).toEqual(city);
  });
});

describe('loadUserSettings and saveUserSettings', () => {
  const storage = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  };

  afterEach(() => {
    storage.clear();
    vi.unstubAllGlobals();
  });

  it('loads settings from localStorage', () => {
    vi.stubGlobal('localStorage', localStorageMock);
    saveUserSettings({ ...defaultUserSettings, hour12: false });

    expect(loadUserSettings()).toEqual({
      ...defaultUserSettings,
      hour12: false,
    });
  });

  it('returns defaults when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(loadUserSettings()).toEqual(defaultUserSettings);
    saveUserSettings({ ...defaultUserSettings, showLocation: false });
  });
});
