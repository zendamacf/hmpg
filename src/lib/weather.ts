export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type City = Coordinates & {
  /** Text to show to the user, for example "Brisbane, Australia". */
  name: string;
};

export type Weather = {
  temperatureC: number;
  code: number;
  isDay: boolean;
};

export type WeatherIconName =
  | 'sun'
  | 'moon'
  | 'cloud-sun'
  | 'cloud-moon'
  | 'cloud'
  | 'smog'
  | 'cloud-rain'
  | 'cloud-showers-heavy'
  | 'snowflake'
  | 'cloud-bolt';

export type Condition = {
  label: string;
  icon: WeatherIconName;
};

export type WeatherState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; weather: Weather }
  | { status: 'denied' }
  | { status: 'error' };

export type LocationFailure = 'denied' | 'unavailable' | 'unsupported';

export class LocationError extends Error {
  readonly reason: LocationFailure;

  constructor(reason: LocationFailure) {
    super(`location ${reason}`);
    this.name = 'LocationError';
    this.reason = reason;
  }
}

export class WeatherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherError';
  }
}

const FAHRENHEIT_REGIONS = new Set(['US', 'BS', 'BZ', 'KY', 'PW']);

export const defaultTemperatureUnit = (locale: string | undefined): TemperatureUnit => {
  if (!locale) {
    return 'celsius';
  }
  try {
    const region = new Intl.Locale(locale).region;
    return region && FAHRENHEIT_REGIONS.has(region) ? 'fahrenheit' : 'celsius';
  } catch {
    return 'celsius';
  }
};

export const formatTemperature = (celsius: number, unit: TemperatureUnit): string => {
  const value = unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
  const rounded = Math.round(value);
  return `${Object.is(rounded, -0) ? 0 : rounded}°`;
};

/** Reads a coordinate that may be stored as text. Returns null if it is not a valid number. */
export const parseCoordinate = (value: string | number | null | undefined): number | null => {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const toCoordinates = (
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): Coordinates | null => {
  const lat = parseCoordinate(latitude);
  const lon = parseCoordinate(longitude);
  if (lat == null || lon == null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null;
  }
  return { latitude: lat, longitude: lon };
};

// WMO weather interpretation codes, as used by Open-Meteo.
export const describeWeather = (code: number, isDay: boolean): Condition => {
  const clear: WeatherIconName = isDay ? 'sun' : 'moon';
  const partly: WeatherIconName = isDay ? 'cloud-sun' : 'cloud-moon';
  switch (code) {
    case 0:
      return { label: 'Clear sky', icon: clear };
    case 1:
      return { label: 'Mostly clear', icon: clear };
    case 2:
      return { label: 'Partly cloudy', icon: partly };
    case 3:
      return { label: 'Overcast', icon: 'cloud' };
    case 45:
    case 48:
      return { label: 'Fog', icon: 'smog' };
    case 51:
    case 53:
    case 55:
      return { label: 'Drizzle', icon: 'cloud-rain' };
    case 56:
    case 57:
    case 66:
    case 67:
      return { label: 'Freezing rain', icon: 'cloud-rain' };
    case 61:
    case 63:
    case 65:
      return { label: 'Rain', icon: 'cloud-rain' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { label: 'Snow', icon: 'snowflake' };
    case 80:
    case 81:
    case 82:
      return { label: 'Rain showers', icon: 'cloud-showers-heavy' };
    case 85:
    case 86:
      return { label: 'Snow showers', icon: 'snowflake' };
    case 95:
      return { label: 'Thunderstorm', icon: 'cloud-bolt' };
    case 96:
    case 99:
      return { label: 'Thunderstorm with hail', icon: 'cloud-bolt' };
    default:
      return { label: 'Conditions unknown', icon: 'cloud' };
  }
};

export const weatherUrl = ({ latitude, longitude }: Coordinates): string => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code,is_day',
    timezone: 'auto',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
};

export const geocodeUrl = (query: string): string => {
  const params = new URLSearchParams({
    name: query.trim(),
    count: '1',
    language: 'en',
    format: 'json',
  });
  return `https://geocoding-api.open-meteo.com/v1/search?${params}`;
};

type Fetcher = (url: string) => Promise<Response>;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const parseWeather = (payload: unknown): Weather => {
  const current = (payload as { current?: Record<string, unknown> } | null)?.current;
  if (
    !current ||
    !isNumber(current.temperature_2m) ||
    !isNumber(current.weather_code) ||
    !isNumber(current.is_day)
  ) {
    throw new WeatherError('unexpected weather response');
  }
  return {
    temperatureC: current.temperature_2m,
    code: current.weather_code,
    isDay: current.is_day === 1,
  };
};

export const fetchWeather = async (
  coordinates: Coordinates,
  fetcher: Fetcher = (url) => fetch(url),
): Promise<Weather> => {
  let response: Response;
  try {
    response = await fetcher(weatherUrl(coordinates));
  } catch {
    throw new WeatherError('weather request failed');
  }
  if (!response.ok) {
    throw new WeatherError(`weather request returned ${response.status}`);
  }
  try {
    return parseWeather(await response.json());
  } catch (error) {
    if (error instanceof WeatherError) {
      throw error;
    }
    throw new WeatherError('weather response is not JSON');
  }
};

type GeocodeResult = {
  name?: unknown;
  admin1?: unknown;
  country?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

export const parseCity = (payload: unknown): City | null => {
  const first = (payload as { results?: GeocodeResult[] } | null)?.results?.[0];
  if (
    !first ||
    typeof first.name !== 'string' ||
    !isNumber(first.latitude) ||
    !isNumber(first.longitude)
  ) {
    return null;
  }
  const region = typeof first.country === 'string' ? first.country : null;
  return {
    name: region ? `${first.name}, ${region}` : first.name,
    latitude: first.latitude,
    longitude: first.longitude,
  };
};

/** Looks up a city by name. Returns null when nothing matches. Throws WeatherError if the search fails. */
export const findCity = async (
  query: string,
  fetcher: Fetcher = (url) => fetch(url),
): Promise<City | null> => {
  const trimmed = query.trim();
  if (trimmed === '') {
    return null;
  }
  let response: Response;
  try {
    response = await fetcher(geocodeUrl(trimmed));
  } catch {
    throw new WeatherError('city search failed');
  }
  if (!response.ok) {
    throw new WeatherError(`city search returned ${response.status}`);
  }
  try {
    return parseCity(await response.json());
  } catch {
    throw new WeatherError('city search response is not JSON');
  }
};

type Position = { coords: { latitude: number; longitude: number } };
type PositionError = { code: number };

export type GeolocationLike = {
  getCurrentPosition: (
    success: (position: Position) => void,
    failure: (error: PositionError) => void,
    options?: { maximumAge?: number; timeout?: number },
  ) => void;
};

const PERMISSION_DENIED = 1;

/** Asks the browser for the device location. Rejects with a LocationError. */
export const getPosition = (
  geolocation: GeolocationLike | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.geolocation,
): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    if (!geolocation) {
      reject(new LocationError('unsupported'));
      return;
    }
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) =>
        reject(new LocationError(error.code === PERMISSION_DENIED ? 'denied' : 'unavailable')),
      { maximumAge: 60 * 60 * 1000, timeout: 10_000 },
    );
  });

// Cache -----------------------------------------------------------------

export const WEATHER_CACHE_KEY = 'hmpg:weather-cache';
export const WEATHER_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { fetchedAt: number; weather: Weather };
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const cacheKey = ({ latitude, longitude }: Coordinates): string =>
  `${latitude.toFixed(2)},${longitude.toFixed(2)}`;

const readCache = (storage: StorageLike | undefined): Record<string, CacheEntry> => {
  if (!storage) {
    return {};
  }
  try {
    const parsed = JSON.parse(storage.getItem(WEATHER_CACHE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const loadWeather = async (
  coordinates: Coordinates,
  options: { fetcher?: Fetcher; storage?: StorageLike; now?: number } = {},
): Promise<Weather> => {
  const { fetcher, storage, now = Date.now() } = options;
  const key = cacheKey(coordinates);
  const cache = readCache(storage);
  const hit = cache[key];
  if (
    hit &&
    isNumber(hit.fetchedAt) &&
    now - hit.fetchedAt >= 0 &&
    now - hit.fetchedAt < WEATHER_TTL_MS
  ) {
    try {
      return parseWeather({
        current: {
          temperature_2m: hit.weather.temperatureC,
          weather_code: hit.weather.code,
          is_day: hit.weather.isDay ? 1 : 0,
        },
      });
    } catch {
      // Ignore a damaged entry and fetch again.
    }
  }

  const weather = await fetchWeather(coordinates, fetcher);

  if (storage) {
    // Keep only fresh entries so the cache does not grow with every new photo.
    const fresh = Object.fromEntries(
      Object.entries(cache).filter(
        ([, entry]) => isNumber(entry?.fetchedAt) && now - entry.fetchedAt < WEATHER_TTL_MS,
      ),
    );
    fresh[key] = { fetchedAt: now, weather };
    try {
      storage.setItem(WEATHER_CACHE_KEY, JSON.stringify(fresh));
    } catch {
      // Storage can be full or blocked. The weather still shows.
    }
  }
  return weather;
};

// State helpers ---------------------------------------------------------

export type WeatherDeps = {
  fetcher?: Fetcher;
  storage?: StorageLike;
  now?: number;
};

export type UserWeatherResult = {
  state: WeatherState;
  coordinates: Coordinates | null;
};

/**
 * Weather for the user. Uses the chosen city when there is one, otherwise the
 * device location. Location never goes to hmpg's own server.
 */
export const loadUserWeather = async (
  city: City | null,
  locate: () => Promise<Coordinates> = getPosition,
  deps: WeatherDeps = {},
): Promise<UserWeatherResult> => {
  let coordinates: Coordinates;
  if (city) {
    coordinates = { latitude: city.latitude, longitude: city.longitude };
  } else {
    try {
      coordinates = await locate();
    } catch (error) {
      const denied = error instanceof LocationError && error.reason === 'denied';
      return { state: denied ? { status: 'denied' } : { status: 'error' }, coordinates: null };
    }
  }
  try {
    return {
      state: { status: 'ready', weather: await loadWeather(coordinates, deps) },
      coordinates,
    };
  } catch {
    return { state: { status: 'error' }, coordinates };
  }
};

/** Weather at the photo's location. Any failure leaves the photo without weather. */
export const loadPhotoWeather = async (
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
  deps: WeatherDeps = {},
): Promise<WeatherState> => {
  const coordinates = toCoordinates(latitude, longitude);
  if (!coordinates) {
    return { status: 'idle' };
  }
  try {
    return { status: 'ready', weather: await loadWeather(coordinates, deps) };
  } catch {
    return { status: 'error' };
  }
};
