import { describe, expect, it } from 'vitest';
import { quoteForDay, quotes } from './quotes';

describe('quotes', () => {
  it('has text and an author for every quote, with no duplicates', () => {
    for (const quote of quotes) {
      expect(quote.text.trim()).not.toBe('');
      expect(quote.author.trim()).not.toBe('');
    }
    expect(new Set(quotes.map((quote) => quote.text)).size).toBe(quotes.length);
  });

  it('keeps quotes short enough for small screens', () => {
    for (const quote of quotes) {
      expect(quote.text.length).toBeLessThanOrEqual(120);
    }
  });
});

describe('quoteForDay', () => {
  it('returns the same quote all day', () => {
    const morning = new Date(Date.UTC(2024, 0, 1, 0, 1));
    const night = new Date(Date.UTC(2024, 0, 1, 23, 59));
    expect(quoteForDay(morning, { timeZone: 'UTC' })).toBe(quoteForDay(night, { timeZone: 'UTC' }));
  });

  it('changes at midnight in the selected time zone', () => {
    const before = new Date(Date.UTC(2024, 0, 1, 23, 59));
    const after = new Date(Date.UTC(2024, 0, 2, 0, 1));
    expect(quoteForDay(before, { timeZone: 'UTC' })).not.toBe(
      quoteForDay(after, { timeZone: 'UTC' }),
    );
  });

  it('uses the local date of the selected time zone', () => {
    // 20:00 UTC on Jan 1 is already Jan 2 in Auckland.
    const d = new Date(Date.UTC(2024, 0, 1, 20, 0));
    const jan2 = new Date(Date.UTC(2024, 0, 2, 12, 0));
    expect(quoteForDay(d, { timeZone: 'Pacific/Auckland' })).toBe(
      quoteForDay(jan2, { timeZone: 'UTC' }),
    );
  });

  it('cycles through every quote', () => {
    const seen = new Set<string>();
    for (let day = 0; day < quotes.length; day++) {
      seen.add(quoteForDay(new Date(Date.UTC(2024, 0, 1 + day, 12)), { timeZone: 'UTC' }).text);
    }
    expect(seen.size).toBe(quotes.length);
  });
});
