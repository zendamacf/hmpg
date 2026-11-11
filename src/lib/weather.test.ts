import { describe, expect, it, vi } from 'vitest';
import {
  type City,
  type Coordinates,
  defaultTemperatureUnit,
  describeWeather,
  fetchWeather,
  findCity,
  formatTemperature,
  type GeolocationLike,
  geocodeUrl,
  getPosition,
  LocationError,
  loadPhotoWeather,
  loadUserWeather,
  loadWeather,
  parseCity,
  parseWeather,
  toCoordinates,
  WEATHER_CACHE_KEY,
  WEATHER_TTL_MS,
  WeatherError,
  weatherUrl,
} from './weather';

const brisbane: Coordinates = { latitude: -27.47, longitude: 153.03 };

const payload = (overrides: Record<string, unknown> = {}) => ({
  current: { temperature_2m: 21.4, weather_code: 2, is_day: 1, ...overrides },
});

const okResponse = (body: unknown) => new Response(JSON.stringify(body));

const memoryStorage = () => {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
};

describe('defaultTemperatureUnit', () => {
  it('uses Fahrenheit for en-US and a few other regions', () => {
    expect(defaultTemperatureUnit('en-US')).toBe('fahrenheit');
    expect(defaultTemperatureUnit('es-US')).toBe('fahrenheit');
    expect(defaultTemperatureUnit('en-BS')).toBe('fahrenheit');
  });

  it('uses Celsius everywhere else', () => {
    expect(defaultTemperatureUnit('en-GB')).toBe('celsius');
    expect(defaultTemperatureUnit('fr')).toBe('celsius');
  });

  it('uses Celsius when the language is missing or invalid', () => {
    expect(defaultTemperatureUnit(undefined)).toBe('celsius');
    expect(defaultTemperatureUnit('')).toBe('celsius');
    expect(defaultTemperatureUnit('not a locale!')).toBe('celsius');
  });
});

describe('formatTemperature', () => {
  it('rounds Celsius', () => {
    expect(formatTemperature(21.4, 'celsius')).toBe('21°');
    expect(formatTemperature(21.5, 'celsius')).toBe('22°');
  });

  it('converts to Fahrenheit', () => {
    expect(formatTemperature(0, 'fahrenheit')).toBe('32°');
    expect(formatTemperature(21.4, 'fahrenheit')).toBe('71°');
    expect(formatTemperature(-40, 'fahrenheit')).toBe('-40°');
  });

  it('never shows negative zero', () => {
    expect(formatTemperature(-0.4, 'celsius')).toBe('0°');
  });
});

describe('toCoordinates', () => {
  it('reads numbers stored as text', () => {
    expect(toCoordinates('37.8651', '-119.5383')).toEqual({
      latitude: 37.8651,
      longitude: -119.5383,
    });
  });

  it('rejects missing, blank, invalid and out-of-range values', () => {
    expect(toCoordinates(null, '10')).toBeNull();
    expect(toCoordinates('10', undefined)).toBeNull();
    expect(toCoordinates(' ', '10')).toBeNull();
    expect(toCoordinates('abc', '10')).toBeNull();
    expect(toCoordinates('91', '10')).toBeNull();
    expect(toCoordinates('10', '181')).toBeNull();
  });
});

describe('describeWeather', () => {
  it('picks day and night icons for clear and partly cloudy skies', () => {
    expect(describeWeather(0, true)).toEqual({ label: 'Clear sky', icon: 'sun' });
    expect(describeWeather(0, false)).toEqual({ label: 'Clear sky', icon: 'moon' });
    expect(describeWeather(2, true).icon).toBe('cloud-sun');
    expect(describeWeather(2, false).icon).toBe('cloud-moon');
  });

  it.each([
    [1, 'Mostly clear'],
    [3, 'Overcast'],
    [45, 'Fog'],
    [48, 'Fog'],
    [53, 'Drizzle'],
    [57, 'Freezing rain'],
    [63, 'Rain'],
    [67, 'Freezing rain'],
    [75, 'Snow'],
    [77, 'Snow'],
    [81, 'Rain showers'],
    [86, 'Snow showers'],
    [95, 'Thunderstorm'],
    [99, 'Thunderstorm with hail'],
  ])('describes code %i as %s', (code, label) => {
    expect(describeWeather(code, true).label).toBe(label);
  });

  it('falls back for unknown codes', () => {
    expect(describeWeather(1234, true)).toEqual({ label: 'Conditions unknown', icon: 'cloud' });
  });
});

describe('urls', () => {
  it('asks Open-Meteo for the current conditions only', () => {
    const url = new URL(weatherUrl(brisbane));
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('-27.47');
    expect(url.searchParams.get('longitude')).toBe('153.03');
    expect(url.searchParams.get('current')).toBe('temperature_2m,weather_code,is_day');
  });

  it('encodes the city name', () => {
    const url = new URL(geocodeUrl('  São Paulo & co '));
    expect(url.origin).toBe('https://geocoding-api.open-meteo.com');
    expect(url.searchParams.get('name')).toBe('São Paulo & co');
    expect(url.searchParams.get('count')).toBe('1');
  });
});

describe('parseWeather', () => {
  it('reads the current conditions', () => {
    expect(parseWeather(payload())).toEqual({ temperatureC: 21.4, code: 2, isDay: true });
    expect(parseWeather(payload({ is_day: 0 })).isDay).toBe(false);
  });

  it.each([
    ['null', null],
    ['no current block', {}],
    ['text temperature', payload({ temperature_2m: '21' })],
    ['missing code', payload({ weather_code: undefined })],
    ['missing day flag', payload({ is_day: null })],
    ['NaN temperature', payload({ temperature_2m: Number.NaN })],
  ])('throws for %s', (_name, value) => {
    expect(() => parseWeather(value)).toThrow(WeatherError);
  });
});

describe('fetchWeather', () => {
  it('returns parsed weather', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload()));
    await expect(fetchWeather(brisbane, fetcher)).resolves.toEqual({
      temperatureC: 21.4,
      code: 2,
      isDay: true,
    });
    expect(fetcher).toHaveBeenCalledWith(weatherUrl(brisbane));
  });

  it('throws when the network fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('offline'));
    await expect(fetchWeather(brisbane, fetcher)).rejects.toThrow('weather request failed');
  });

  it('throws on a server error', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('no', { status: 503 }));
    await expect(fetchWeather(brisbane, fetcher)).rejects.toThrow('returned 503');
  });

  it('throws when the body is not JSON', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('<html>'));
    await expect(fetchWeather(brisbane, fetcher)).rejects.toThrow('not JSON');
  });

  it('throws when the body has the wrong shape', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse({ hello: 'world' }));
    await expect(fetchWeather(brisbane, fetcher)).rejects.toThrow('unexpected weather response');
  });
});

describe('parseCity and findCity', () => {
  const result = {
    name: 'Brisbane',
    country: 'Australia',
    latitude: -27.46794,
    longitude: 153.02809,
  };

  it('builds a label from the name and country', () => {
    expect(parseCity({ results: [result] })).toEqual({
      name: 'Brisbane, Australia',
      latitude: -27.46794,
      longitude: 153.02809,
    });
  });

  it('uses the name alone when there is no country', () => {
    expect(parseCity({ results: [{ ...result, country: undefined }] })?.name).toBe('Brisbane');
  });

  it('returns null when nothing matches or the result is damaged', () => {
    expect(parseCity({})).toBeNull();
    expect(parseCity({ results: [] })).toBeNull();
    expect(parseCity({ results: [{ name: 'X' }] })).toBeNull();
    expect(parseCity(null)).toBeNull();
  });

  it('finds a city', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse({ results: [result] }));
    await expect(findCity(' Brisbane ', fetcher)).resolves.toMatchObject({
      name: 'Brisbane, Australia',
    });
    expect(fetcher).toHaveBeenCalledWith(geocodeUrl('Brisbane'));
  });

  it('does not search for blank text', async () => {
    const fetcher = vi.fn();
    await expect(findCity('   ', fetcher)).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns null for an unknown city', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse({}));
    await expect(findCity('Nowhereville', fetcher)).resolves.toBeNull();
  });

  it('throws when the search fails', async () => {
    await expect(findCity('x', vi.fn().mockRejectedValue(new Error('offline')))).rejects.toThrow(
      'city search failed',
    );
    await expect(
      findCity('x', vi.fn().mockResolvedValue(new Response('', { status: 500 }))),
    ).rejects.toThrow('returned 500');
    await expect(findCity('x', vi.fn().mockResolvedValue(new Response('<html>')))).rejects.toThrow(
      'not JSON',
    );
  });
});

describe('getPosition', () => {
  const geolocation = (outcome: 'ok' | number): GeolocationLike => ({
    getCurrentPosition: (success, failure) => {
      if (outcome === 'ok') {
        success({ coords: { latitude: -27.47, longitude: 153.03 } });
      } else {
        failure({ code: outcome });
      }
    },
  });

  it('resolves with the coordinates', async () => {
    await expect(getPosition(geolocation('ok'))).resolves.toEqual(brisbane);
  });

  it('rejects with "denied" when the user says no', async () => {
    await expect(getPosition(geolocation(1))).rejects.toMatchObject({ reason: 'denied' });
  });

  it.each([2, 3])('rejects with "unavailable" for error code %i', async (code) => {
    await expect(getPosition(geolocation(code))).rejects.toMatchObject({ reason: 'unavailable' });
  });

  it('rejects with "unsupported" when the browser has no geolocation', async () => {
    vi.stubGlobal('navigator', {});
    try {
      await expect(getPosition()).rejects.toBeInstanceOf(LocationError);
      await expect(getPosition()).rejects.toMatchObject({ reason: 'unsupported' });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('loadWeather cache', () => {
  it('stores a fetched result and reuses it while it is fresh', async () => {
    const storage = memoryStorage();
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload()));

    const first = await loadWeather(brisbane, { fetcher, storage, now: 1_000 });
    const second = await loadWeather(brisbane, {
      fetcher,
      storage,
      now: 1_000 + WEATHER_TTL_MS - 1,
    });

    expect(second).toEqual(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('fetches again when the entry has expired', async () => {
    const storage = memoryStorage();
    const fetcher = vi.fn().mockImplementation(async () => okResponse(payload()));

    await loadWeather(brisbane, { fetcher, storage, now: 1_000 });
    await loadWeather(brisbane, { fetcher, storage, now: 1_000 + WEATHER_TTL_MS });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('drops expired entries when it saves a new one', async () => {
    const storage = memoryStorage();
    const fetcher = vi.fn().mockImplementation(async () => okResponse(payload()));
    const elsewhere: Coordinates = { latitude: 10, longitude: 20 };

    await loadWeather(elsewhere, { fetcher, storage, now: 0 });
    await loadWeather(brisbane, { fetcher, storage, now: WEATHER_TTL_MS + 1 });

    const saved = JSON.parse(storage.store.get(WEATHER_CACHE_KEY) ?? '{}');
    expect(Object.keys(saved)).toEqual(['-27.47,153.03']);
  });

  it('shares one entry for nearby coordinates', async () => {
    const storage = memoryStorage();
    const fetcher = vi.fn().mockImplementation(async () => okResponse(payload()));

    await loadWeather({ latitude: -27.4701, longitude: 153.0299 }, { fetcher, storage, now: 0 });
    await loadWeather({ latitude: -27.4699, longitude: 153.0301 }, { fetcher, storage, now: 1 });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('ignores a damaged cache', async () => {
    const storage = memoryStorage();
    storage.store.set(WEATHER_CACHE_KEY, '{not json');
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload()));
    await expect(loadWeather(brisbane, { fetcher, storage, now: 0 })).resolves.toMatchObject({
      code: 2,
    });

    storage.store.set(WEATHER_CACHE_KEY, '[1,2]');
    await expect(
      loadWeather(brisbane, {
        fetcher: vi.fn().mockResolvedValue(okResponse(payload())),
        storage,
        now: 0,
      }),
    ).resolves.toMatchObject({ code: 2 });

    storage.store.set(
      WEATHER_CACHE_KEY,
      JSON.stringify({ '-27.47,153.03': { fetchedAt: 0, weather: { temperatureC: 'hot' } } }),
    );
    const refetch = vi.fn().mockResolvedValue(okResponse(payload()));
    await loadWeather(brisbane, { fetcher: refetch, storage, now: 1 });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('still returns weather when storage cannot be written', async () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload()));
    await expect(loadWeather(brisbane, { fetcher, storage })).resolves.toMatchObject({ code: 2 });
  });

  it('works without storage', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload()));
    await expect(loadWeather(brisbane, { fetcher })).resolves.toMatchObject({ code: 2 });
  });
});

describe('loadUserWeather', () => {
  const city: City = { name: 'Oslo, Norway', latitude: 59.91, longitude: 10.75 };
  const fetcher = () => vi.fn().mockImplementation(async () => okResponse(payload()));

  it('uses the chosen city and never asks for the device location', async () => {
    const locate = vi.fn();
    const result = await loadUserWeather(city, locate, { fetcher: fetcher() });

    expect(locate).not.toHaveBeenCalled();
    expect(result.state.status).toBe('ready');
    expect(result.coordinates).toEqual({ latitude: 59.91, longitude: 10.75 });
  });

  it('uses the device location when there is no city', async () => {
    const locate = vi.fn().mockResolvedValue(brisbane);
    const result = await loadUserWeather(null, locate, { fetcher: fetcher() });

    expect(result.state.status).toBe('ready');
    expect(result.coordinates).toEqual(brisbane);
  });

  it('reports "denied" when the user blocks location', async () => {
    const locate = vi.fn().mockRejectedValue(new LocationError('denied'));
    await expect(loadUserWeather(null, locate, { fetcher: fetcher() })).resolves.toEqual({
      state: { status: 'denied' },
      coordinates: null,
    });
  });

  it('reports an error when the location is unavailable or unsupported', async () => {
    for (const reason of ['unavailable', 'unsupported'] as const) {
      const locate = vi.fn().mockRejectedValue(new LocationError(reason));
      const result = await loadUserWeather(null, locate, { fetcher: fetcher() });
      expect(result.state.status).toBe('error');
    }
    const result = await loadUserWeather(null, vi.fn().mockRejectedValue(new Error('boom')), {});
    expect(result.state.status).toBe('error');
  });

  it('reports an error, with the location, when the weather request fails', async () => {
    const failing = vi.fn().mockRejectedValue(new TypeError('offline'));
    const result = await loadUserWeather(city, vi.fn(), { fetcher: failing });
    expect(result).toEqual({
      state: { status: 'error' },
      coordinates: { latitude: 59.91, longitude: 10.75 },
    });
  });
});

describe('loadPhotoWeather', () => {
  it('loads weather for the photo coordinates', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload()));
    const state = await loadPhotoWeather('37.8651', '-119.5383', { fetcher });
    expect(state.status).toBe('ready');
    expect(fetcher).toHaveBeenCalledWith(weatherUrl({ latitude: 37.8651, longitude: -119.5383 }));
  });

  it('skips photos without coordinates', async () => {
    const fetcher = vi.fn();
    await expect(loadPhotoWeather(null, null, { fetcher })).resolves.toEqual({ status: 'idle' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('reports an error when the request fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('offline'));
    await expect(loadPhotoWeather('1', '2', { fetcher })).resolves.toEqual({ status: 'error' });
  });
});
