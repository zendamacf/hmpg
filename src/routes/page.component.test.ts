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

  describe('weather', () => {
    const forecast = (temperature: number, code: number, isDay = 1) =>
      new Response(
        JSON.stringify({
          current: { temperature_2m: temperature, weather_code: code, is_day: isDay },
        }),
      );

    // The photo is at 37.8651, -119.5383. Everything else is "the user".
    const routeFetch = (options: { user?: Response | Error; photo?: Response | Error } = {}) => {
      fetchMock.mockImplementation(async (input: string | URL) => {
        const url = new URL(String(input));
        if (url.hostname === 'api.open-meteo.com') {
          const isPhoto = url.searchParams.get('latitude') === '37.8651';
          const result = isPhoto
            ? (options.photo ?? forecast(6.2, 0))
            : (options.user ?? forecast(21.4, 2));
          if (result instanceof Error) {
            throw result;
          }
          return result.clone();
        }
        if (url.hostname === 'geocoding-api.open-meteo.com') {
          const name = url.searchParams.get('name');
          return new Response(
            JSON.stringify(
              name === 'Oslo'
                ? {
                    results: [
                      { name: 'Oslo', country: 'Norway', latitude: 59.91, longitude: 10.75 },
                    ],
                  }
                : {},
            ),
          );
        }
        return new Response();
      });
    };

    const allow = (latitude = -27.47, longitude = 153.03) => {
      const getCurrentPosition = vi.fn((success) => success({ coords: { latitude, longitude } }));
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition },
      });
      return getCurrentPosition;
    };

    const block = (code: number) => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (_ok: unknown, fail: (e: { code: number }) => void) => fail({ code }),
        },
      });
    };

    const weatherRequests = () =>
      fetchMock.mock.calls.filter(([input]) => String(input).includes('api.open-meteo.com'));

    const withSettings = (patch: Record<string, unknown>) =>
      localStorageMock.setItem(
        'hmpg:user-settings',
        JSON.stringify({ ...defaultUserSettings, ...patch }),
      );

    beforeEach(() => {
      routeFetch();
      withSettings({ temperatureUnit: 'celsius' });
    });

    afterEach(() => {
      delete (navigator as { geolocation?: unknown }).geolocation;
    });

    it('shows the user weather large and the photo weather beside its location', async () => {
      allow();
      const { container } = render(Page, { props: pageProps });

      expect(await screen.findByText('21°')).toBeInTheDocument();
      expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
      expect(screen.getByText('Where you are')).toBeInTheDocument();

      const there = container.querySelector('.place .there');
      expect(there?.textContent).toMatch(/6°\s+Clear sky/);
      // The user's weather comes first in the page and sits outside the location button.
      expect(container.querySelector('.here')?.closest('.place')).toBeNull();
    });

    it('asks the browser for the location without sending it to our server', async () => {
      const getCurrentPosition = allow();
      render(Page, { props: pageProps });
      await screen.findByText('21°');

      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
      const hosts = fetchMock.mock.calls.map(
        ([input]) => new URL(String(input), 'http://localhost').hostname,
      );
      expect(hosts.every((host) => host.endsWith('open-meteo.com') || host === 'localhost')).toBe(
        true,
      );
      expect(
        fetchMock.mock.calls.some(
          ([input]) => String(input).includes('-27.47') && !String(input).includes('open-meteo'),
        ),
      ).toBe(false);
    });

    it('uses Fahrenheit by default for en-US browsers, and follows the unit setting', async () => {
      allow();
      withSettings({ temperatureUnit: null });
      const { unmount } = render(Page, { props: pageProps });
      expect(await screen.findByText('71°')).toBeInTheDocument();
      unmount();

      withSettings({ temperatureUnit: 'celsius' });
      render(Page, { props: pageProps });
      expect(await screen.findByText('21°')).toBeInTheDocument();
    });

    it('switches units from the settings panel and saves the choice', async () => {
      allow();
      render(Page, { props: pageProps });
      await screen.findByText('21°');

      await screen.getByRole('button', { name: 'Display settings' }).click();
      await fireEvent.click(screen.getByRole('radio', { name: '°F' }));

      expect(await screen.findByText('71°')).toBeInTheDocument();
      expect(JSON.parse(storage.get('hmpg:user-settings') ?? '{}').temperatureUnit).toBe(
        'fahrenheit',
      );
    });

    it('explains a blocked location and offers a city instead', async () => {
      block(1);
      render(Page, { props: pageProps });

      expect(await screen.findByText(/Location is blocked/)).toBeInTheDocument();
      // The photo weather still shows.
      expect(await screen.findByText(/Clear sky/)).toBeInTheDocument();

      await fireEvent.click(screen.getByRole('button', { name: 'Choose a city' }));
      expect(await screen.findByLabelText('Weather city')).toHaveFocus();
    });

    it('shows a retry when the location cannot be found', async () => {
      block(2);
      render(Page, { props: pageProps });

      expect(await screen.findByText(/Weather is unavailable/)).toBeInTheDocument();
    });

    it('keeps the page working when the user weather request fails', async () => {
      allow();
      routeFetch({ user: new TypeError('offline') });
      render(Page, { props: pageProps });

      expect(await screen.findByText(/Weather is unavailable/)).toBeInTheDocument();
      expect(await screen.findByText(/Clear sky/)).toBeInTheDocument();
      expect(screen.getByText('Yosemite')).toBeInTheDocument();
      expect(clock()).toBe('3:0507pm');
    });

    it('retries after a failure', async () => {
      allow();
      routeFetch({ user: new Response('', { status: 503 }) });
      render(Page, { props: pageProps });
      await screen.findByText(/Weather is unavailable/);

      routeFetch();
      await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByText('21°')).toBeInTheDocument();
      expect(screen.queryByText(/Weather is unavailable/)).not.toBeInTheDocument();
    });

    it('shows no photo weather when its request fails', async () => {
      allow();
      routeFetch({ photo: new Response('', { status: 500 }) });
      const { container } = render(Page, { props: pageProps });

      expect(await screen.findByText('21°')).toBeInTheDocument();
      expect(container.querySelector('.there')).toBeNull();
    });

    it('shows no photo weather when the photo has no coordinates', async () => {
      allow();
      const { container } = render(Page, {
        props: { ...pageProps, data: { photo: { ...photo, latitude: null, longitude: null } } },
      });

      expect(await screen.findByText('21°')).toBeInTheDocument();
      expect(container.querySelector('.there')).toBeNull();
      expect(weatherRequests()).toHaveLength(1);
    });

    it('hides the photo weather with the photo location', async () => {
      allow();
      withSettings({ temperatureUnit: 'celsius', showLocation: false });
      const { container } = render(Page, { props: pageProps });

      expect(await screen.findByText('21°')).toBeInTheDocument();
      expect(container.querySelector('.there')).toBeNull();
    });

    it('does nothing when weather is off', async () => {
      const getCurrentPosition = allow();
      withSettings({ showWeather: false });
      const { container } = render(Page, { props: pageProps });
      await vi.advanceTimersByTimeAsync(50);

      expect(container.querySelector('.weather-slot')).toBeNull();
      expect(getCurrentPosition).not.toHaveBeenCalled();
      expect(weatherRequests()).toHaveLength(0);
    });

    it('turns weather on and off from the settings panel', async () => {
      allow();
      render(Page, { props: pageProps });
      await screen.findByText('21°');

      await screen.getByRole('button', { name: 'Display settings' }).click();
      await fireEvent.click(screen.getByRole('switch', { name: 'Show weather' }));
      expect(screen.queryByText('21°')).not.toBeInTheDocument();
      expect(JSON.parse(storage.get('hmpg:user-settings') ?? '{}').showWeather).toBe(false);

      await fireEvent.click(screen.getByRole('switch', { name: 'Show weather' }));
      expect(await screen.findByText('21°')).toBeInTheDocument();
    });

    it('uses a saved city and never asks for the device location', async () => {
      const getCurrentPosition = allow();
      withSettings({
        temperatureUnit: 'celsius',
        weatherCity: { name: 'Oslo, Norway', latitude: 59.91, longitude: 10.75 },
      });
      render(Page, { props: pageProps });

      expect(await screen.findByText('Oslo, Norway')).toBeInTheDocument();
      expect(getCurrentPosition).not.toHaveBeenCalled();
    });

    it('finds a city, saves it and shows its weather', async () => {
      block(1);
      render(Page, { props: pageProps });
      await screen.findByText(/Location is blocked/);

      await fireEvent.click(screen.getByRole('button', { name: 'Choose a city' }));
      const input = await screen.findByLabelText('Weather city');
      await fireEvent.input(input, { target: { value: 'Oslo' } });
      await fireEvent.click(screen.getByRole('button', { name: 'Find' }));

      expect(await screen.findByText('Oslo, Norway')).toBeInTheDocument();
      expect(screen.queryByText(/Location is blocked/)).not.toBeInTheDocument();
      expect(JSON.parse(storage.get('hmpg:user-settings') ?? '{}').weatherCity).toEqual({
        name: 'Oslo, Norway',
        latitude: 59.91,
        longitude: 10.75,
      });
    });

    it('searches when Enter is pressed in the city field', async () => {
      allow();
      render(Page, { props: pageProps });
      await screen.findByText('21°');
      await screen.getByRole('button', { name: 'Display settings' }).click();

      const input = screen.getByLabelText('Weather city');
      await fireEvent.input(input, { target: { value: 'Oslo' } });
      await fireEvent.keyDown(input, { key: 'Enter' });

      expect(
        await screen.findByText('Oslo, Norway', { selector: '.here-place' }),
      ).toBeInTheDocument();
    });

    it('says when no city matches', async () => {
      allow();
      render(Page, { props: pageProps });
      await screen.findByText('21°');
      await screen.getByRole('button', { name: 'Display settings' }).click();

      await fireEvent.input(screen.getByLabelText('Weather city'), {
        target: { value: 'Nowhereville' },
      });
      await fireEvent.click(screen.getByRole('button', { name: 'Find' }));

      expect(await screen.findByText('No city found. Check the spelling.')).toBeInTheDocument();
      expect(screen.getByText('21°')).toBeInTheDocument();
    });

    it('says when the city search fails', async () => {
      allow();
      render(Page, { props: pageProps });
      await screen.findByText('21°');
      await screen.getByRole('button', { name: 'Display settings' }).click();

      fetchMock.mockRejectedValue(new TypeError('offline'));
      await fireEvent.input(screen.getByLabelText('Weather city'), { target: { value: 'Oslo' } });
      await fireEvent.click(screen.getByRole('button', { name: 'Find' }));

      expect(
        await screen.findByText('City search is unavailable. Try again later.'),
      ).toBeInTheDocument();
    });

    it('goes back to the device location when the city is cleared', async () => {
      const getCurrentPosition = allow();
      withSettings({
        temperatureUnit: 'celsius',
        weatherCity: { name: 'Oslo, Norway', latitude: 59.91, longitude: 10.75 },
      });
      render(Page, { props: pageProps });
      await screen.findByText('Oslo, Norway');
      await screen.getByRole('button', { name: 'Display settings' }).click();

      await fireEvent.input(screen.getByLabelText('Weather city'), { target: { value: '' } });

      expect(await screen.findByText('Where you are')).toBeInTheDocument();
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
      expect(JSON.parse(storage.get('hmpg:user-settings') ?? '{}').weatherCity).toBeNull();
    });

    it('refreshes the weather every 15 minutes without asking for the location again', async () => {
      const getCurrentPosition = allow();
      render(Page, { props: pageProps });
      await screen.findByText('21°');
      const before = weatherRequests().length;

      routeFetch({ user: forecast(25.2, 0) });
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000 + 100);

      expect(await screen.findByText('25°')).toBeInTheDocument();
      expect(weatherRequests().length).toBeGreaterThan(before);
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it('does not ask again after the location was blocked', async () => {
      const getCurrentPosition = vi.fn((_ok: unknown, fail: (e: { code: number }) => void) =>
        fail({ code: 1 }),
      );
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition },
      });
      render(Page, { props: pageProps });
      await screen.findByText(/Location is blocked/);

      await vi.advanceTimersByTimeAsync(15 * 60 * 1000 + 100);

      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it('describes night conditions', async () => {
      allow();
      routeFetch({ user: forecast(4, 0, 0) });
      const { container } = render(Page, { props: pageProps });

      expect(await screen.findByText('4°')).toBeInTheDocument();
      expect(container.querySelector('.here .fa-moon')).not.toBeNull();
    });
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
