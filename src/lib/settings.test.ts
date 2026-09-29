import { describe, expect, it } from 'vitest';
import { defaultUserSettings, parseUserSettings } from './settings';

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
