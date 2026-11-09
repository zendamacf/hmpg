import { describe, expect, it } from 'vitest';
import { formatCoordinates } from './coordinates.js';

describe('formatCoordinates', () => {
  it('formats hemispheres and rounds to three decimals', () => {
    expect(formatCoordinates('37.8651', '-119.5383')).toBe('37.865° N, 119.538° W');
    expect(formatCoordinates('-33.8688', '151.2093')).toBe('33.869° S, 151.209° E');
  });

  it('returns an empty string when either value is missing or invalid', () => {
    expect(formatCoordinates(null, '10')).toBe('');
    expect(formatCoordinates('10', null)).toBe('');
    expect(formatCoordinates('', '10')).toBe('');
    expect(formatCoordinates('abc', '10')).toBe('');
  });
});
