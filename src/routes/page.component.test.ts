// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quoteForDay } from '#lib/quotes.js';
import { defaultUserSettings } from '#lib/settings.js';
import Page from './+page.svelte';
import type { PageProps } from './$types';

const { invalidateAll } = vi.hoisted(() => ({
  invalidateAll: vi.fn(),
}));

vi.mock('$app/navigation', () => ({
  invalidateAll,
}));

const photo = {
  id: 1,
  url: 'https://example.com/photo.jpg',
  latitude: '37.8651',
  longitude: '-119.5383',
  location: 'Yosemite',
  author_name: 'Jane Doe',
  author_username: 'janedoe_photo',
  author_instagram: 'janedoe',
  unsplash_id: 'photo-1',
};

const pageProps: PageProps = {
  params: {},
  data: { photo },
  form: undefined,
};

describe('+page.svelte', () => {
  const open = vi.fn();
  const reload = vi.fn();
  const fetchMock = vi.fn();
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

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2024, 0, 1, 15, 5, 7));
    invalidateAll.mockReset();
    open.mockReset();
    reload.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response());
    storage.clear();
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('open', open);
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the background image and photo metadata', () => {
    const { container } = render(Page, { props: pageProps });

    const background = container.querySelector('.background');
    expect(background).toHaveStyle({ '--image-url': 'url(https://example.com/photo.jpg)' });
    expect(screen.getByText('Yosemite')).toBeInTheDocument();
    expect(screen.getByText(/Taken by/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Instagram @janedoe' })).toBeInTheDocument();
  });

  const clock = () => screen.getByRole('timer').textContent?.replace(/\s+/g, '');

  it('renders the clock and date from the current time', () => {
    render(Page, { props: pageProps });

    expect(clock()).toBe('3:0507pm');
    expect(screen.getByText('Monday, January 1')).toBeInTheDocument();
  });

  it('renders the photo coordinates next to the location', () => {
    render(Page, { props: pageProps });

    expect(screen.getByText('37.865° N, 119.538° W')).toBeInTheDocument();
  });

  it('updates the clock every second', async () => {
    render(Page, { props: pageProps });

    expect(clock()).toBe('3:0507pm');

    await vi.advanceTimersByTimeAsync(1000);

    expect(clock()).toBe('3:0508pm');
  });

  it('clears the clock interval on unmount', async () => {
    const { unmount } = render(Page, { props: pageProps });
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('opens Google Maps over HTTPS when the location button is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: /Yosemite/i }).click();

    expect(open).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=37.8651,-119.5383',
      '_blank',
      'noopener',
    );
  });

  it('opens the Unsplash author profile when the author name is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: 'Jane Doe' }).click();

    expect(open).toHaveBeenCalledWith(
      'https://unsplash.com/@janedoe_photo?utm_source=hmpg&utm_medium=referral',
      '_blank',
      'noopener',
    );
  });

  it('shows the author name as plain text when there is no username', () => {
    render(Page, {
      props: {
        ...pageProps,
        data: { photo: { ...photo, author_username: null } },
      },
    });

    expect(screen.queryByRole('button', { name: 'Jane Doe' })).not.toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
  });

  it('opens the Unsplash photo page when Unsplash is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: 'Unsplash' }).click();

    expect(open).toHaveBeenCalledWith(
      'https://unsplash.com/photos/photo-1?utm_source=hmpg&utm_medium=referral',
      '_blank',
      'noopener',
    );
  });

  it('opens Instagram when the Instagram button is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: 'Instagram @janedoe' }).click();

    expect(open).toHaveBeenCalledWith(
      'https://instagram.com/janedoe',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('opens the GitHub repo when the credit button is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: 'GitHub icon' }).click();

    expect(open).toHaveBeenCalledWith('https://github.com/zendamacf/hmpg', '_blank');
  });

  it('applies persisted settings from localStorage', async () => {
    localStorageMock.setItem(
      'hmpg:user-settings',
      JSON.stringify({
        ...defaultUserSettings,
        hour12: false,
        showAttribution: false,
        showLocation: false,
      }),
    );

    render(Page, { props: pageProps });

    expect(clock()).toBe('15:0507');
    expect(screen.queryByText('Yosemite')).not.toBeInTheDocument();
    expect(screen.queryByText(/Taken by/)).not.toBeInTheDocument();
  });

  it('shows the greeting and daily quote by default', () => {
    render(Page, { props: pageProps });

    const quote = quoteForDay(new Date(2024, 0, 1, 15, 5, 7));
    expect(screen.getByText('Good afternoon')).toBeInTheDocument();
    expect(screen.getByText(quote.text)).toBeInTheDocument();
    expect(screen.getByText(quote.author)).toBeInTheDocument();
  });

  it('hides the greeting and quote when settings turn them off', () => {
    localStorageMock.setItem(
      'hmpg:user-settings',
      JSON.stringify({ ...defaultUserSettings, showGreeting: false, showQuote: false }),
    );

    render(Page, { props: pageProps });

    const quote = quoteForDay(new Date(2024, 0, 1, 15, 5, 7));
    expect(screen.queryByText('Good afternoon')).not.toBeInTheDocument();
    expect(screen.queryByText(quote.text)).not.toBeInTheDocument();
  });

  it('falls back to defaults when localStorage is corrupt', () => {
    localStorageMock.setItem('hmpg:user-settings', '{bad json');

    render(Page, { props: pageProps });

    expect(screen.getByText('Yosemite')).toBeInTheDocument();
    expect(clock()).toBe('3:0507pm');
  });

  it('renders an empty state and retries via invalidateAll', async () => {
    const { container } = render(Page, {
      props: { ...pageProps, data: { photo: null } },
    });

    expect(screen.getByText(/No background photo is available/i)).toBeInTheDocument();
    expect(container.querySelector('.background.empty')).toBeTruthy();
    expect(screen.queryByText('Yosemite')).not.toBeInTheDocument();

    await screen.getByRole('button', { name: 'Try again' }).click();
    expect(invalidateAll).toHaveBeenCalled();
  });

  describe('settings panel', () => {
    const openPanel = async () => {
      await screen.getByRole('button', { name: 'Display settings' }).click();
    };

    it('opens from the gear button and closes on Escape', async () => {
      render(Page, { props: pageProps });
      expect(screen.queryByRole('form', { name: 'Display settings' })).not.toBeInTheDocument();

      await openPanel();
      expect(screen.getByRole('form', { name: 'Display settings' })).toBeInTheDocument();

      await fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('form', { name: 'Display settings' })).not.toBeInTheDocument();
    });

    it('closes when clicking outside the panel', async () => {
      render(Page, { props: pageProps });
      await openPanel();

      await fireEvent.pointerDown(document.body);
      expect(screen.queryByRole('form', { name: 'Display settings' })).not.toBeInTheDocument();
    });

    it('toggles the greeting and saves the setting', async () => {
      render(Page, { props: pageProps });
      await openPanel();

      await fireEvent.click(screen.getByRole('switch', { name: 'Show greeting' }));
      expect(screen.queryByText('Good afternoon')).not.toBeInTheDocument();
      expect(JSON.parse(storage.get('hmpg:user-settings') ?? '{}').showGreeting).toBe(false);

      await fireEvent.click(screen.getByRole('switch', { name: 'Show greeting' }));
      expect(screen.getByText('Good afternoon')).toBeInTheDocument();
    });

    it('toggles the daily quote and saves the setting', async () => {
      render(Page, { props: pageProps });
      const quote = quoteForDay(new Date(2024, 0, 1, 15, 5, 7));
      await openPanel();

      await fireEvent.click(screen.getByRole('switch', { name: 'Show daily quote' }));
      expect(screen.queryByText(quote.text)).not.toBeInTheDocument();
      expect(JSON.parse(storage.get('hmpg:user-settings') ?? '{}').showQuote).toBe(false);

      await fireEvent.click(screen.getByRole('switch', { name: 'Show daily quote' }));
      expect(screen.getByText(quote.text)).toBeInTheDocument();
    });

    it('switches to a 24-hour clock', async () => {
      render(Page, { props: pageProps });
      await openPanel();

      await fireEvent.click(screen.getByRole('switch', { name: '12-hour clock' }));
      expect(clock()).toBe('15:0507');
    });

    it('ignores incomplete time zones and applies valid ones', async () => {
      render(Page, { props: pageProps });
      await openPanel();
      const input = screen.getByLabelText(/Time zone/);

      await fireEvent.input(input, { target: { value: 'Eur' } });
      expect(screen.getByText(/Choose a name from the list/)).toBeInTheDocument();
      expect(clock()).toBe('3:0507pm');
      expect(storage.get('hmpg:user-settings')).toBeUndefined();

      await fireEvent.input(input, { target: { value: 'Pacific/Auckland' } });
      expect(screen.queryByText(/Choose a name from the list/)).not.toBeInTheDocument();
      expect(JSON.parse(storage.get('hmpg:user-settings') ?? '{}').timezone).toBe(
        'Pacific/Auckland',
      );
    });
  });
});
