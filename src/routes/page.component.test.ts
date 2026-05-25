// @vitest-environment jsdom

import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';
import type { PageProps } from './$types';

const pageProps: PageProps = {
  params: {},
  data: {
    id: 1,
    url: 'https://example.com/photo.jpg',
    latitude: '37.8651',
    longitude: '-119.5383',
    location: 'Yosemite',
    author_name: 'Jane Doe',
    author_instagram: 'janedoe',
    unsplashid: 'photo-1',
  },
  form: undefined,
};

describe('+page.svelte', () => {
  const open = vi.fn();
  const reload = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2024, 0, 1, 15, 5, 7));
    open.mockReset();
    reload.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response());
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

  it('opens Google Maps when the location button is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: /Yosemite/i }).click();

    expect(open).toHaveBeenCalledWith('http://maps.google.com/?q=37.8651,-119.5383', '_blank');
  });

  it('opens the photo URL when the author button is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: /Taken by Jane Doe/i }).click();

    expect(open).toHaveBeenCalledWith('https://example.com/photo.jpg', '_blank');
  });

  it('opens the GitHub repo when the credit button is clicked', async () => {
    render(Page, { props: pageProps });

    await screen.getByRole('button', { name: 'GitHub icon' }).click();

    expect(open).toHaveBeenCalledWith('https://github.com/zendamacf/hmpg', '_blank');
  });

  it('refreshes the image when the refresh button is clicked', async () => {
    const { container } = render(Page, { props: pageProps });

    await screen.getByRole('button', { name: 'Refresh image' }).click();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/refresh'));

    expect(container.querySelector('.refresh i')).toHaveClass('fa-spin');
    expect(reload).toHaveBeenCalled();
  });
});
