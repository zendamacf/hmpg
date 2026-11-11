import { describe, expect, it } from 'vitest';
import { greetingFor } from './greeting';

const utc = (hour: number, minute = 0) => new Date(Date.UTC(2024, 0, 1, hour, minute));

describe('greetingFor', () => {
  it.each([
    [0, 'Good evening'],
    [4, 'Good evening'],
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [23, 'Good evening'],
  ])('uses the right greeting at %i:00', (hour, expected) => {
    expect(greetingFor(utc(hour), { timeZone: 'UTC' })).toBe(expected);
  });

  it('switches at the exact boundary minute', () => {
    expect(greetingFor(utc(4, 59), { timeZone: 'UTC' })).toBe('Good evening');
    expect(greetingFor(utc(5, 0), { timeZone: 'UTC' })).toBe('Good morning');
  });

  it('follows the selected time zone', () => {
    // 20:00 UTC is 09:00 the next day in Auckland.
    expect(greetingFor(utc(20), { timeZone: 'UTC' })).toBe('Good evening');
    expect(greetingFor(utc(20), { timeZone: 'Pacific/Auckland' })).toBe('Good morning');
  });

  it('treats a null time zone as the browser time zone', () => {
    expect(greetingFor(new Date(2024, 0, 1, 9), { timeZone: null })).toBe('Good morning');
  });
});
