import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('app.html', () => {
  it('does not load third-party font or icon CDNs', () => {
    const html = readFileSync(new URL('../src/app.html', import.meta.url), 'utf8');
    expect(html).not.toMatch(/fonts\.googleapis\.com/);
    expect(html).not.toMatch(/kit\.fontawesome\.com/);
  });
});
