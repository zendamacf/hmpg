import { describe, expect, it } from 'vitest';
import { timeParts } from './time';

describe('timeParts', () => {
  it('formats afternoon times with pm', () => {
    expect(timeParts(new Date(2024, 0, 1, 15, 5, 7))).toEqual({
      hours: 3,
      minutes: '05',
      seconds: '07',
      ampm: 'pm',
    });
  });

  it('formats morning times with am', () => {
    expect(timeParts(new Date(2024, 0, 1, 9, 30, 0))).toEqual({
      hours: 9,
      minutes: '30',
      seconds: '00',
      ampm: 'am',
    });
  });

  it('uses 12 for midnight', () => {
    expect(timeParts(new Date(2024, 0, 1, 0, 0, 0))).toEqual({
      hours: 12,
      minutes: '00',
      seconds: '00',
      ampm: 'am',
    });
  });

  it('uses 12 for noon', () => {
    expect(timeParts(new Date(2024, 0, 1, 12, 0, 0))).toEqual({
      hours: 12,
      minutes: '00',
      seconds: '00',
      ampm: 'pm',
    });
  });
});
