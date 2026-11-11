<script lang="ts">
import { onMount } from 'svelte';
import { formatCoordinates } from '#lib/coordinates.js';
import { greetingFor } from '#lib/greeting.js';
import Icon from '#lib/Icon.svelte';
import {
  choosePhoto,
  emptyPicks,
  isFavorite,
  isPinned,
  loadPicks,
  type PhotoPicks,
  savePicks,
  toggleFavorite,
  togglePin,
} from '#lib/photo-picks.js';
import { quoteForDay } from '#lib/quotes.js';
import {
  defaultUserSettings,
  loadUserSettings,
  saveUserSettings,
  type UserSettings,
} from '#lib/settings.js';
import { dateLabel, isValidTimeZone, supportedTimeZones, timeParts } from '#lib/time.js';
import { trackEvent } from '#lib/umami.js';
import { invalidateAll } from '$app/navigation';
import type { PageProps } from './$types';

const { data }: PageProps = $props();

// A pinned or favorite photo replaces the server photo once, when the page loads.
let override = $state<NonNullable<typeof data.photo> | null>(null);
let picks = $state<PhotoPicks>(emptyPicks);
const photo = $derived(override ?? data.photo);
const pinned = $derived(photo ? isPinned(picks, photo) : false);
const favorite = $derived(photo ? isFavorite(picks, photo) : false);
const coordinates = $derived(photo ? formatCoordinates(photo.latitude, photo.longitude) : '');

let settings = $state<UserSettings>(defaultUserSettings);
let showSettings = $state(false);
let mounted = $state(false);
let loaded = $state(false);
let timezoneDraft = $state('');
let timezoneInvalid = $state(false);
let controlsEl = $state<HTMLElement>();
let settingsButton = $state<HTMLButtonElement>();

const mapsUrl = (latitude: string | null, longitude: string | null) => {
  if (latitude == null || longitude == null) {
    return 'https://www.google.com/maps';
  }
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
};

const instagramUrl = (username: string) => `https://instagram.com/${username}`;

const unsplashAuthorUrl = (username: string | null) =>
  username
    ? `https://unsplash.com/@${username}?utm_source=hmpg&utm_medium=referral`
    : 'https://unsplash.com/?utm_source=hmpg&utm_medium=referral';

const unsplashPhotoUrl = (unsplashId: string | null) =>
  unsplashId
    ? `https://unsplash.com/photos/${unsplashId}?utm_source=hmpg&utm_medium=referral`
    : 'https://unsplash.com/?utm_source=hmpg&utm_medium=referral';

let time = $state(timeParts(new Date()));
let date = $state(dateLabel(new Date()));
let greeting = $state(greetingFor(new Date()));
let quote = $state(quoteForDay(new Date()));

const refreshClock = () => {
  const now = new Date();
  const options = { hour12: settings.hour12, timeZone: settings.timezone };
  time = timeParts(now, options);
  date = dateLabel(now, options);
  greeting = greetingFor(now, options);
  quote = quoteForDay(now, options);
};

const updateSettings = (patch: Partial<UserSettings>) => {
  settings = { ...settings, ...patch };
  saveUserSettings(settings);
  refreshClock();
};

const updatePicks = (next: PhotoPicks) => {
  picks = next;
  savePicks(next);
};

const onPin = () => {
  if (!photo) {
    return;
  }
  trackEvent('photo-pin', { on: !pinned });
  updatePicks(togglePin(picks, photo));
};

const onFavorite = () => {
  if (!photo) {
    return;
  }
  trackEvent('photo-favorite', { on: !favorite });
  updatePicks(toggleFavorite(picks, photo));
};

const onTimezoneInput = (value: string) => {
  timezoneDraft = value;
  const trimmed = value.trim();
  if (trimmed === '') {
    timezoneInvalid = false;
    trackEvent('setting-change', { key: 'timezone', value: '' });
    updateSettings({ timezone: null });
    return;
  }
  // Only save complete, valid zones so a half-typed name never reaches the clock.
  timezoneInvalid = !isValidTimeZone(trimmed);
  if (!timezoneInvalid) {
    trackEvent('setting-change', { key: 'timezone', value: trimmed });
    updateSettings({ timezone: trimmed });
  }
};

const closeSettings = (returnFocus: boolean) => {
  showSettings = false;
  if (returnFocus) {
    settingsButton?.focus();
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showSettings) {
    closeSettings(true);
  }
};

const onPointerDown = (event: PointerEvent) => {
  if (showSettings && controlsEl && !controlsEl.contains(event.target as Node)) {
    closeSettings(false);
  }
};

const timezoneOptions = supportedTimeZones();

// Fade the photo in once it has actually arrived, instead of letting it pop in.
$effect(() => {
  const url = photo?.url;
  loaded = false;
  if (!url) {
    return;
  }
  const img = new Image();
  const done = () => {
    loaded = true;
  };
  img.onload = done;
  img.onerror = done;
  img.src = url;
  return () => {
    img.onload = null;
    img.onerror = null;
  };
});

onMount(() => {
  settings = loadUserSettings();
  picks = loadPicks();
  const chosen = choosePhoto(data.photo, picks);
  override = chosen === data.photo ? null : chosen;
  timezoneDraft = settings.timezone ?? '';
  refreshClock();
  mounted = true;
  const intervalId = setInterval(refreshClock, 1000);
  return () => clearInterval(intervalId);
});
</script>

<svelte:window onkeydown={onKeydown} onpointerdown={onPointerDown} />

<div
  class="background"
  class:empty={!photo}
  class:loaded
  style={photo?.url ? `--image-url: url(${photo.url})` : undefined}
></div>

<main class="stage" class:ready={mounted}>
  <section class="clock-block">
    {#if settings.showGreeting}
      <p class="greeting">{greeting}</p>
    {/if}
    <p class="date">{date}</p>
    <div class="time" role="timer" aria-label="Current time">
      <span class="digits">{time.hours}:{time.minutes}</span>
      <span class="aside">
        <span class="seconds">{time.seconds}</span>
        {#if time.ampm}
          <span class="ampm">{time.ampm}</span>
        {/if}
      </span>
    </div>
    {#if settings.showQuote}
      <figure class="quote">
        <blockquote>{quote.text}</blockquote>
        <figcaption>{quote.author}</figcaption>
      </figure>
    {/if}
    {#if !photo}
      <p class="empty-message">No background photo is available right now.</p>
      <button
        class="retry"
        type="button"
        onclick={() => {
          trackEvent('photo-retry');
          invalidateAll();
        }}
      >
        Try again
      </button>
    {/if}
  </section>

  <footer class="caption">
    {#if photo && settings.showLocation && (photo.location || coordinates)}
      <button
        class="place"
        onclick={() => {
          trackEvent('outbound-link', { target: 'maps' });
          window.open(mapsUrl(photo.latitude, photo.longitude), '_blank', 'noopener');
        }}
      >
        <Icon name="map-marker" />
        <span class="place-text">
          {#if photo.location}
            <span class="name">{photo.location}</span>
          {/if}
          {#if coordinates}
            <span class="coords">{coordinates}</span>
          {/if}
        </span>
      </button>
    {/if}

    <div class="trailing">
      {#if photo}
        <div class="picks">
          <button
            class="icon-btn pick pin"
            class:on={pinned}
            type="button"
            aria-pressed={pinned}
            aria-label={pinned ? 'Unpin photo' : 'Pin photo'}
            title={pinned ? 'Unpin photo' : 'Pin photo'}
            onclick={onPin}
          >
            <Icon name="pin" />
          </button>
          <button
            class="icon-btn pick"
            class:on={favorite}
            type="button"
            aria-pressed={favorite}
            aria-label={favorite ? 'Remove photo from favorites' : 'Add photo to favorites'}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            onclick={onFavorite}
          >
            <Icon name={favorite ? 'heart' : 'heart-outline'} />
          </button>
        </div>
      {/if}
      {#if photo && settings.showAttribution}
        <span class="link credit">
          <Icon name="camera" />
          <span class="name">
            Taken by
            {#if photo.author_username}
              <button
                class="inline"
                onclick={() => {
                  trackEvent('outbound-link', { target: 'unsplash-author' });
                  window.open(unsplashAuthorUrl(photo.author_username), '_blank', 'noopener');
                }}
              >
                {photo.author_name}
              </button>
            {:else}
              {photo.author_name}
            {/if}
            on
            <button
              class="inline"
              onclick={() => {
                trackEvent('outbound-link', { target: 'unsplash' });
                window.open(unsplashPhotoUrl(photo.unsplash_id), '_blank', 'noopener');
              }}
            >
              Unsplash
            </button>
          </span>
        </span>

        {#if photo.author_instagram}
          <button
            class="link"
            onclick={() => {
              trackEvent('outbound-link', { target: 'instagram' });
              window.open(
                instagramUrl(photo.author_instagram ?? ''),
                '_blank',
                'noopener,noreferrer',
              );
            }}
            aria-label="Instagram @{photo.author_instagram}"
          >
            <Icon name="instagram" />
            <span class="name">@{photo.author_instagram}</span>
          </button>
        {/if}
      {/if}

      <div class="controls" bind:this={controlsEl}>
        {#if showSettings}
          <form
            class="panel"
            id="settings-panel"
            onsubmit={(event) => event.preventDefault()}
            aria-label="Display settings"
          >
            <label class="row">
              <span>12-hour clock</span>
              <input
                class="switch"
                type="checkbox"
                role="switch"
                checked={settings.hour12}
                onchange={(event) => {
                  const hour12 = (event.currentTarget as HTMLInputElement).checked;
                  trackEvent('setting-change', { key: 'hour12', value: hour12 });
                  updateSettings({ hour12 });
                }}
              />
            </label>
            <label class="row">
              <span>Show greeting</span>
              <input
                class="switch"
                type="checkbox"
                role="switch"
                checked={settings.showGreeting}
                onchange={(event) => {
                  const showGreeting = (event.currentTarget as HTMLInputElement).checked;
                  trackEvent('setting-change', { key: 'showGreeting', value: showGreeting });
                  updateSettings({ showGreeting });
                }}
              />
            </label>
            <label class="row">
              <span>Show daily quote</span>
              <input
                class="switch"
                type="checkbox"
                role="switch"
                checked={settings.showQuote}
                onchange={(event) => {
                  const showQuote = (event.currentTarget as HTMLInputElement).checked;
                  trackEvent('setting-change', { key: 'showQuote', value: showQuote });
                  updateSettings({ showQuote });
                }}
              />
            </label>
            <label class="row">
              <span>Show location</span>
              <input
                class="switch"
                type="checkbox"
                role="switch"
                checked={settings.showLocation}
                onchange={(event) => {
                  const showLocation = (event.currentTarget as HTMLInputElement).checked;
                  trackEvent('setting-change', { key: 'showLocation', value: showLocation });
                  updateSettings({ showLocation });
                }}
              />
            </label>
            <label class="row">
              <span>Show photo credit</span>
              <input
                class="switch"
                type="checkbox"
                role="switch"
                checked={settings.showAttribution}
                onchange={(event) => {
                  const showAttribution = (event.currentTarget as HTMLInputElement).checked;
                  trackEvent('setting-change', { key: 'showAttribution', value: showAttribution });
                  updateSettings({ showAttribution });
                }}
              />
            </label>
            <label class="field">
              <span>Time zone</span>
              <input
                type="text"
                list="timezones"
                placeholder="Browser default"
                autocomplete="off"
                spellcheck="false"
                value={timezoneDraft}
                aria-invalid={timezoneInvalid}
                aria-describedby="timezone-hint"
                oninput={(event) => onTimezoneInput((event.currentTarget as HTMLInputElement).value)}
              />
              <span class="hint" class:invalid={timezoneInvalid} id="timezone-hint">
                {timezoneInvalid
                  ? 'Choose a name from the list, like Europe/London.'
                  : 'Leave blank to use your browser’s time zone.'}
              </span>
            </label>
            <datalist id="timezones">
              {#each timezoneOptions as zone (zone)}
                <option value={zone}></option>
              {/each}
            </datalist>
          </form>
        {/if}

        <button
          class="icon-btn"
          bind:this={settingsButton}
          onclick={() => {
            showSettings = !showSettings;
            trackEvent('settings-toggle', { open: showSettings });
          }}
          aria-expanded={showSettings}
          aria-controls="settings-panel"
          aria-label="Display settings"
        >
          <Icon name="cog" />
        </button>

        <button
          class="icon-btn"
          onclick={() => {
            trackEvent('outbound-link', { target: 'github' });
            window.open('https://github.com/zendamacf/hmpg', '_blank');
          }}
          aria-label="GitHub icon"
        >
          <Icon name="github" />
        </button>
      </div>
    </div>
  </footer>
</main>

<style>
  :global(:root) {
    --night: #08121a;
    --deep-teal: #0b5563;
    --glacier: #9fe3e8;
    --snow: #f7f5f0;
    --mist: rgb(247 245 240 / 0.74);
    --lift: rgb(247 245 240 / 0.14);
  }

  :global(body) {
    margin: 0;
    overflow: hidden;
    background: var(--night);
    color: var(--snow);
    font-family: 'Bricolage Grotesque Variable', system-ui, sans-serif;
    font-optical-sizing: auto;
  }

  :global(.icon) {
    display: inline-block;
    vertical-align: middle;
    font-size: 1.1em;
    line-height: 1;
    flex-shrink: 0;
  }

  button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    margin: 0;
    cursor: pointer;
    text-shadow: 0 1px 14px rgb(0 0 0 / 0.5);
    transition:
      background-color 0.2s ease,
      color 0.2s ease;

    &:focus-visible {
      outline: 2px solid var(--glacier);
      outline-offset: 2px;
    }
  }

  input:focus-visible {
    outline: 2px solid var(--glacier);
    outline-offset: 2px;
  }

  /* Photo layer ------------------------------------------------------ */

  .background {
    position: fixed;
    inset: 0;
    z-index: 1;
    background-color: var(--night);
    background-image: var(--image-url);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    opacity: 0;
    transition: opacity 1.2s ease;

    /* Darkens the lower third so the clock and captions read on any photo. */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgb(8 18 26 / 0.78) 0%,
        rgb(8 18 26 / 0.45) 32%,
        rgb(8 18 26 / 0) 62%
      );
    }

    &.loaded {
      opacity: 1;
    }

    &.empty {
      opacity: 1;
      background-image:
        repeating-radial-gradient(
          circle at 78% 18%,
          transparent 0 26px,
          rgb(159 227 232 / 0.07) 26px 27px
        ),
        repeating-radial-gradient(
          circle at 12% 92%,
          transparent 0 34px,
          rgb(159 227 232 / 0.06) 34px 35px
        ),
        linear-gradient(160deg, var(--deep-teal) 0%, var(--night) 70%);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .background.loaded:not(.empty) {
      animation: settle 3s cubic-bezier(0.2, 0.7, 0.2, 1) both;
    }
  }

  @keyframes settle {
    from {
      transform: scale(1.04);
    }
    to {
      transform: scale(1);
    }
  }

  /* Layout ----------------------------------------------------------- */

  .stage {
    position: fixed;
    inset: 0;
    z-index: 2;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: clamp(1.25rem, 3vw, 2.5rem);
    opacity: 0;

    &.ready {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .stage.ready .clock-block {
      animation: rise 1s cubic-bezier(0.2, 0.7, 0.2, 1) 0.35s both;
    }
    .stage.ready .caption {
      animation: fade 1s ease 0.9s both;
    }
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(1.25rem);
    }
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }

  /* Clock ------------------------------------------------------------ */

  .clock-block {
    margin-bottom: clamp(1rem, 4vh, 2.25rem);
  }

  .greeting {
    margin: 0 0 0.05em 0.14em;
    font-size: clamp(1.4rem, 3.2vw, 2.4rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    text-shadow: 0 1px 14px rgb(0 0 0 / 0.5);
  }

  .date {
    margin: 0 0 0.1em 0.2em;
    font-size: clamp(1.05rem, 2.2vw, 1.6rem);
    font-weight: 500;
    color: var(--mist);
    text-shadow: 0 1px 14px rgb(0 0 0 / 0.5);
  }

  .time {
    display: flex;
    align-items: flex-start;
    gap: 0.08em;
    font-size: clamp(5rem, 21vw, 17rem);
    font-variant-numeric: tabular-nums;
    line-height: 0.86;
    text-shadow: 0 4px 48px rgb(0 0 0 / 0.3);
  }

  .digits {
    font-weight: 200;
    letter-spacing: -0.025em;
  }

  .aside {
    display: flex;
    flex-direction: column;
    gap: 0.06em;
    margin-top: 0.1em;
    font-size: 0.24em;
    letter-spacing: 0;
  }

  .seconds {
    font-weight: 400;
    color: var(--mist);
  }

  .ampm {
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .quote {
    margin: clamp(0.9rem, 2.6vh, 1.6rem) 0 0 0.2em;
    max-width: min(36ch, 100%);
    font-size: clamp(1.05rem, 1.9vw, 1.45rem);
    line-height: 1.4;
    text-shadow: 0 1px 14px rgb(0 0 0 / 0.5);

    blockquote {
      margin: 0;
      font-weight: 400;
      text-wrap: pretty;
    }

    figcaption {
      margin-top: 0.4em;
      font-size: 0.82em;
      color: var(--mist);
    }
  }

  .empty-message {
    margin: 1.25rem 0 0 0.2em;
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: var(--mist);
  }

  .retry {
    margin: 0.75rem 0 0 0.2em;
    padding: 0.5em 1.25em;
    border: 1px solid var(--glacier);
    border-radius: 999px;
    color: var(--glacier);
    font-weight: 600;
    text-shadow: none;

    &:hover {
      background: var(--glacier);
      color: var(--night);
    }
  }

  /* Caption row ------------------------------------------------------ */

  .caption {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.75rem 1.5rem;
  }

  .trailing {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0.25rem;
    margin-left: auto;
  }

  .place,
  .link {
    display: inline-flex;
    align-items: center;
    gap: 0.6em;
    padding: 0.5em 0.8em;
    border-radius: 0.75em;
    text-align: left;

    &:hover {
      background: var(--lift);
    }
  }

  .place {
    margin-left: -0.8em;
    padding-left: 0.8em;
    font-size: 1.05rem;

    .place-text {
      display: flex;
      flex-direction: column;
      gap: 0.1em;
    }

    .name {
      font-size: 1.2em;
      font-weight: 600;
    }

    .coords {
      font-size: 0.85em;
      font-variant-numeric: tabular-nums;
      color: var(--mist);
    }
  }

  .link {
    font-size: 0.95rem;
    color: var(--mist);

    &:hover {
      color: var(--snow);
    }
  }

  .picks {
    display: flex;
    gap: 0.25rem;
  }

  /* Off: pin lies tilted. On: it stands upright and lights up. */
  .pick.on {
    color: var(--glacier);
  }

  .pin :global(.icon) {
    transform: rotate(45deg);

    @media (prefers-reduced-motion: no-preference) {
      transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.3, 1);
    }
  }

  .pin.on :global(.icon) {
    transform: rotate(0deg);
  }

  .credit:hover {
    background: none;
  }

  .inline {
    padding: 0;
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.2em;

    &:hover {
      color: var(--snow);
    }
  }

  .controls {
    position: relative;
    display: flex;
    gap: 0.25rem;
    margin-left: 0.5rem;
  }

  .icon-btn {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    font-size: 1.05rem;
    color: var(--mist);

    &:hover,
    &[aria-expanded='true'] {
      background: var(--lift);
      color: var(--snow);
    }
  }

  /* Settings panel --------------------------------------------------- */

  .panel {
    position: absolute;
    right: 0;
    bottom: calc(100% + 0.75rem);
    box-sizing: border-box;
    width: min(20rem, calc(100vw - 2.5rem));
    /* Seven rows now; keep the panel inside short viewports. */
    max-height: calc(100vh - 7rem);
    max-height: calc(100dvh - 7rem);
    overflow-y: auto;
    padding: 0.5rem 1.1rem 1.1rem;
    display: flex;
    flex-direction: column;
    background: rgb(8 18 26 / 0.82);
    -webkit-backdrop-filter: blur(20px) saturate(1.3);
    backdrop-filter: blur(20px) saturate(1.3);
    border: 1px solid rgb(247 245 240 / 0.14);
    border-radius: 1.1rem;
    box-shadow: 0 18px 50px rgb(0 0 0 / 0.35);
    font-size: 0.95rem;
    transform-origin: bottom right;

    @media (prefers-reduced-motion: no-preference) {
      animation: open 0.2s cubic-bezier(0.2, 0.8, 0.3, 1);
    }
  }

  @keyframes open {
    from {
      opacity: 0;
      transform: translateY(0.5rem) scale(0.97);
    }
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 0;
    cursor: pointer;
    border-bottom: 1px solid rgb(247 245 240 / 0.1);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-top: 0.9rem;

    input {
      font: inherit;
      color: var(--snow);
      background: rgb(247 245 240 / 0.08);
      border: 1px solid rgb(247 245 240 / 0.22);
      border-radius: 0.6rem;
      padding: 0.55em 0.75em;

      &::placeholder {
        color: var(--mist);
      }

      &[aria-invalid='true'] {
        border-color: #ffb4a8;
      }
    }

    .hint {
      font-size: 0.82rem;
      color: var(--mist);

      &.invalid {
        color: #ffb4a8;
      }
    }
  }

  .switch {
    appearance: none;
    position: relative;
    flex-shrink: 0;
    width: 2.6rem;
    height: 1.5rem;
    margin: 0;
    border-radius: 999px;
    background: rgb(247 245 240 / 0.24);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &::before {
      content: '';
      position: absolute;
      top: 0.2rem;
      left: 0.2rem;
      width: 1.1rem;
      height: 1.1rem;
      border-radius: 50%;
      background: var(--snow);
      transition:
        transform 0.2s cubic-bezier(0.3, 1.4, 0.5, 1),
        background-color 0.2s ease;
    }

    &:checked {
      background: var(--glacier);

      &::before {
        transform: translateX(1.1rem);
        background: var(--night);
      }
    }
  }

  /* Small screens ---------------------------------------------------- */

  @media (max-width: 40rem) {
    .time {
      font-size: 36vw;
    }
    .quote {
      max-width: 100%;
    }
    .caption {
      flex-direction: column;
      align-items: flex-start;
    }
    .trailing {
      justify-content: flex-start;
      margin-left: -0.8em;
    }
    .controls {
      margin-left: auto;
    }
    .panel {
      right: 0;
    }
  }

  /* Short viewports (phones in landscape, small windows): the clock keeps
     its space, so drop the quote and tighten the greeting. */
  @media (max-height: 32rem) {
    .quote {
      display: none;
    }
    .greeting {
      font-size: 1.15rem;
    }
  }
</style>
