export type UserSettings = {
  hour12: boolean;
  timezone: string | null;
  showAttribution: boolean;
  showLocation: boolean;
};

export const defaultUserSettings: UserSettings = {
  hour12: true,
  timezone: null,
  showAttribution: true,
  showLocation: true,
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
