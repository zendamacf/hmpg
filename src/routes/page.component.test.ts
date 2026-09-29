// @vitest-environment jsdom

import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultUserSettings } from '$lib/settings';
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
    expect(screen.getByText('Taken by Jane Doe on Unsplash')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Instagram @janedoe' })).toBeInTheDocument();
  });

  it('renders the clock from the current time', () => {
    render(Page, { props: pageProps });

    expect(screen.getByText('3:05:07')).toBeInTheDocument();
    expect(screen.getByText('pm')).toBeInTheDocument();
  });

  it('updates the clock every second', async () => {
    render(Page, { props: pageProps });

    expect(screen.getByText('3:05:07')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1000);

    expect(screen.getByText('3:05:08')).toBeInTheDocument();
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

  it('opens the photo URL when the author button is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: /Taken by Jane Doe/i }).click();

    expect(open).toHaveBeenCalledWith('https://example.com/photo.jpg', '_blank');
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

    expect(screen.getByText('15:05:07')).toBeInTheDocument();
    expect(screen.queryByText('Yosemite')).not.toBeInTheDocument();
    expect(screen.queryByText('Taken by Jane Doe on Unsplash')).not.toBeInTheDocument();
  });

  it('falls back to defaults when localStorage is corrupt', () => {
    localStorageMock.setItem('hmpg:user-settings', '{bad json');

    render(Page, { props: pageProps });

    expect(screen.getByText('Yosemite')).toBeInTheDocument();
    expect(screen.getByText('3:05:07')).toBeInTheDocument();
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
});
