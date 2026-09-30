<script lang="ts">
import { onMount } from 'svelte';
import { invalidateAll } from '$app/navigation';
import Icon from '$lib/Icon.svelte';
import {
  defaultUserSettings,
  loadUserSettings,
  saveUserSettings,
  type UserSettings,
} from '$lib/settings';
import { timeParts } from '$lib/time';
import { trackEvent } from '$lib/umami';
import type { PageProps } from './$types';

const { data }: PageProps = $props();

const photo = $derived(data.photo);

let settings = $state<UserSettings>(defaultUserSettings);
let showSettings = $state(false);

const mapsUrl = (latitude: string | null, longitude: string | null) => {
  if (latitude == null || longitude == null) {
    return 'https://www.google.com/maps';
  }
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
};

const instagramUrl = (username: string) => `https://instagram.com/${username}`;

let time = $state(timeParts(new Date()));

const refreshClock = () => {
  time = timeParts(new Date(), {
    hour12: settings.hour12,
    timeZone: settings.timezone,
  });
};

const updateSettings = (patch: Partial<UserSettings>) => {
  settings = { ...settings, ...patch };
  saveUserSettings(settings);
  refreshClock();
};

onMount(() => {
  settings = loadUserSettings();
  refreshClock();
  const intervalId = setInterval(refreshClock, 1000);
  return () => clearInterval(intervalId);
});
</script>

<div
  class="absolute background"
  class:empty={!photo}
  style={photo?.url ? `--image-url: url(${photo.url})` : undefined}
></div>
<div class="absolute foreground">
  <section class="middle">
    <div class="time">
      <span>{time.hours}:{time.minutes}:{time.seconds}</span>
      {#if time.ampm}
        <small class="time-ampm">{time.ampm}</small>
      {/if}
    </div>
    {#if !photo}
      <p class="empty-message">No background photo is available right now.</p>
      <button
        class="retry highlight"
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

  {#if photo}
    <section class="bottom-left">
      {#if settings.showLocation}
        <button
          class="location highlight"
          onclick={() => {
            trackEvent('outbound-link', { target: 'maps' });
            window.open(mapsUrl(photo.latitude, photo.longitude), '_blank', 'noopener');
          }}
        >
          <Icon name="map-marker" />
          &nbsp;
          <span class="name">{photo.location}</span>
        </button>
      {/if}

      {#if settings.showAttribution}
        <button
          class="author highlight"
          onclick={() => {
            trackEvent('outbound-link', { target: 'unsplash' });
            window.open(photo.url ?? '', '_blank');
          }}
        >
          <Icon name="camera" />
          &nbsp;
          <span class="name">Taken by {photo.author_name} on Unsplash</span>
        </button>

        {#if photo.author_instagram}
          <button
            class="author-instagram highlight"
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
            &nbsp;
            <span class="name">@{photo.author_instagram}</span>
          </button>
        {/if}
      {/if}
    </section>
  {/if}

  <section class="bottom-right">
    <button
      class="settings color-in"
      onclick={() => {
        showSettings = !showSettings;
        trackEvent('settings-toggle', { open: showSettings });
      }}
      aria-expanded={showSettings}
      aria-label="Display settings"
    >
      <span class="credit-icon">
        <Icon name="cog" />
      </span>
    </button>

    {#if showSettings}
      <form
        class="settings-panel"
        onsubmit={(event) => event.preventDefault()}
        aria-label="Display settings"
      >
        <label>
          <input
            type="checkbox"
            checked={settings.hour12}
            onchange={(event) => {
              const hour12 = (event.currentTarget as HTMLInputElement).checked;
              trackEvent('setting-change', { key: 'hour12', value: hour12 });
              updateSettings({ hour12 });
            }}
          />
          12-hour clock
        </label>
        <label>
          Timezone override
          <input
            type="text"
            placeholder="Browser default"
            value={settings.timezone ?? ''}
            oninput={(event) => {
              const value = (event.currentTarget as HTMLInputElement).value.trim();
              const timezone = value === '' ? null : value;
              trackEvent('setting-change', { key: 'timezone', value: timezone ?? '' });
              updateSettings({ timezone });
            }}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.showLocation}
            onchange={(event) => {
              const showLocation = (event.currentTarget as HTMLInputElement).checked;
              trackEvent('setting-change', { key: 'showLocation', value: showLocation });
              updateSettings({ showLocation });
            }}
          />
          Show location
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.showAttribution}
            onchange={(event) => {
              const showAttribution = (event.currentTarget as HTMLInputElement).checked;
              trackEvent('setting-change', { key: 'showAttribution', value: showAttribution });
              updateSettings({ showAttribution });
            }}
          />
          Show photo attribution
        </label>
      </form>
    {/if}

    <button
      class="credit color-in"
      onclick={() => {
        trackEvent('outbound-link', { target: 'github' });
        window.open('https://github.com/zendamacf/hmpg', '_blank');
      }}
      aria-label="GitHub icon"
    >
      <span class="credit-icon">
        <Icon name="github" />
      </span>
    </button>
  </section>
</div>

<style>
  :global(body) {
    font-family: 'Lato', sans-serif;
    color: white;
  }
  small {
    font-size: 35%;
  }
  :global(.icon) {
    display: inline-block;
    vertical-align: middle;
    font-size: 1.2em;
    line-height: 1;
    flex-shrink: 0;
  }
  button {
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    color: white;

    &.color-in {
      transition: ease 0.4s;
      &:hover {
        color: #0b5563;
      }
    }

    &.highlight {
      box-shadow: inset 0 0 0 0 #0b5563;
      padding: 0.25em;
      border-radius: 0.25em;
      transition: box-shadow 0.4s ease-in-out;
      &:hover {
        box-shadow: inset 500px 0 0 0 #0b5563;
      }
    }
  }

  .absolute {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .background {
    height: 100%;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    background-color: #464646;
    background-image: var(--image-url);
    z-index: 1;

    &.empty {
      background-image: none;
      background: linear-gradient(160deg, #3a3a3a 0%, #1f1f1f 100%);
    }
  }

  .foreground {
    z-index: 2;

    section {
      position: absolute;
    }

    .middle {
      display: block;
      width: 100%;
      top: 50%;
      -ms-transform: translateY(-50%);
      transform: translateY(-50%);
      text-align: center;
    }

    .bottom-left {
      bottom: 0;
      left: 0;
    }

    .bottom-right {
      bottom: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5em;
      margin-right: 1em;
      margin-bottom: 1em;
    }

    .time {
      font-size: clamp(2rem, 20vw, 12rem);
      font-weight: bold;

      .time-ampm {
        margin-left: 10px;
      }
    }

    .empty-message {
      margin-top: 1rem;
      font-size: clamp(1rem, 3vw, 1.5rem);
      opacity: 0.9;
    }

    .retry {
      margin-top: 1rem;
      font-size: 1.1rem;
    }

    .location {
      display: block;
      margin-left: 1em;
    }

    .author,
    .author-instagram {
      display: block;
      font-style: italic;
      margin-left: 1em;
      margin-bottom: 0.4em;
      margin-top: 0.4em;
    }

    .location + .author {
      margin-top: 0.4em;
    }

    .author-instagram:last-child {
      margin-bottom: 1em;
    }

    .credit,
    .settings {
      display: block;
      transition: ease-in-out all 0.4s;
    }

    .settings-panel {
      background: rgb(0 0 0 / 0.55);
      border-radius: 0.5em;
      padding: 0.75em 1em;
      min-width: 14rem;
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      text-align: left;
      font-size: 0.9rem;

      label {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
      }

      input[type='text'] {
        color: white;
        background: rgb(255 255 255 / 0.1);
        border: 1px solid rgb(255 255 255 / 0.25);
        border-radius: 0.25em;
        padding: 0.25em 0.5em;
      }
    }
  }
</style>
