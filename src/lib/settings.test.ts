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
        }),
      ),
    ).toEqual({
      ...defaultUserSettings,
      hour12: false,
      showLocation: false,
    });
  });

  it('ignores invalid field types', () => {
    expect(
      parseUserSettings(
        JSON.stringify({
          hour12: 'yes',
          timezone: 42,
          showAttribution: 'on',
        }),
      ),
    ).toEqual(defaultUserSettings);
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
