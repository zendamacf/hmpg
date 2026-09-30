import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackEvent, umamiScriptSrc } from './umami';

describe('umamiScriptSrc', () => {
  it('returns null when base URL is missing or blank', () => {
    expect(umamiScriptSrc(undefined)).toBeNull();
    expect(umamiScriptSrc('')).toBeNull();
    expect(umamiScriptSrc('   ')).toBeNull();
  });

  it('appends script.js and strips a trailing slash', () => {
    expect(umamiScriptSrc('https://umami.kalopsia.dev')).toBe(
      'https://umami.kalopsia.dev/script.js',
    );
    expect(umamiScriptSrc('https://umami.kalopsia.dev/')).toBe(
      'https://umami.kalopsia.dev/script.js',
    );
  });
});

describe('trackEvent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls umami.track when the tracker is loaded', () => {
    const track = vi.fn();
    vi.stubGlobal('window', { umami: { track } });

    trackEvent('photo-retry', { reason: 'empty' });

    expect(track).toHaveBeenCalledWith('photo-retry', { reason: 'empty' });
  });

  it('no-ops when umami is not on window', () => {
    vi.stubGlobal('window', {});

    expect(() => trackEvent('photo-retry')).not.toThrow();
  });
});
