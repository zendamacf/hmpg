import { normalizeTopics } from './topics';
import type { City, TemperatureUnit } from './weather';

export type UserSettings = {
  hour12: boolean;
  timezone: string | null;
  showAttribution: boolean;
  showLocation: boolean;
  showGreeting: boolean;
  showQuote: boolean;
  showWeather: boolean;
  /** null means: choose from the browser language. */
  temperatureUnit: TemperatureUnit | null;
  /** City chosen by the user. null means: use the device location. */
  weatherCity: City | null;
  /** Chosen photo topics. Empty means: any topic. */
  topics: string[];
};

export const defaultUserSettings: UserSettings = {
  hour12: true,
  timezone: null,
  showAttribution: true,
  showLocation: true,
  showGreeting: true,
  showQuote: true,
  showWeather: true,
  temperatureUnit: null,
  weatherCity: null,
  topics: [],
};

const parseCity = (value: unknown): City | null => {
  const city = value as Partial<City> | null;
  if (
    city &&
    typeof city.name === 'string' &&
    city.name !== '' &&
    typeof city.latitude === 'number' &&
    Number.isFinite(city.latitude) &&
    Math.abs(city.latitude) <= 90 &&
    typeof city.longitude === 'number' &&
    Number.isFinite(city.longitude) &&
    Math.abs(city.longitude) <= 180
  ) {
    return { name: city.name, latitude: city.latitude, longitude: city.longitude };
  }
  return null;
};

const STORAGE_KEY = 'hmpg:user-settings';

export const parseUserSettings = (raw: string | null): UserSettings => {
  if (!raw) {
    return defaultUserSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      hour12: typeof parsed.hour12 === 'boolean' ? parsed.hour12 : defaultUserSettings.hour12,
      timezone:
        parsed.timezone === null || typeof parsed.timezone === 'string'
          ? parsed.timezone
          : defaultUserSettings.timezone,
      showAttribution:
        typeof parsed.showAttribution === 'boolean'
          ? parsed.showAttribution
          : defaultUserSettings.showAttribution,
      showLocation:
        typeof parsed.showLocation === 'boolean'
          ? parsed.showLocation
          : defaultUserSettings.showLocation,
      showGreeting:
        typeof parsed.showGreeting === 'boolean'
          ? parsed.showGreeting
          : defaultUserSettings.showGreeting,
      showQuote:
        typeof parsed.showQuote === 'boolean' ? parsed.showQuote : defaultUserSettings.showQuote,
      showWeather:
        typeof parsed.showWeather === 'boolean'
          ? parsed.showWeather
          : defaultUserSettings.showWeather,
      temperatureUnit:
        parsed.temperatureUnit === 'celsius' || parsed.temperatureUnit === 'fahrenheit'
          ? parsed.temperatureUnit
          : defaultUserSettings.temperatureUnit,
      weatherCity: parseCity(parsed.weatherCity),
      topics: normalizeTopics(parsed.topics),
    };
  } catch {
    return defaultUserSettings;
  }
};

export const loadUserSettings = (): UserSettings => {
  if (typeof localStorage === 'undefined') {
    return defaultUserSettings;
  }
  return parseUserSettings(localStorage.getItem(STORAGE_KEY));
};

export const saveUserSettings = (settings: UserSettings): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
