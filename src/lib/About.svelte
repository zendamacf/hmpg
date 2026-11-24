<script lang="ts">
import { trackEvent } from '#lib/umami.js';

export type AboutPhoto = {
  author_name: string | null;
  author_username: string | null;
  author_instagram: string | null;
  unsplash_id: string | null;
};

const { photo, onclose }: { photo: AboutPhoto | null; onclose: () => void } = $props();

const utm = '?utm_source=hmpg&utm_medium=referral';

const authorUrl = (username: string) => `https://unsplash.com/@${username}${utm}`;
const photoUrl = (id: string) => `https://unsplash.com/photos/${id}${utm}`;

let dialog = $state<HTMLDialogElement>();

$effect(() => {
  if (dialog && !dialog.open) {
    dialog.showModal();
  }
});

const track = (target: string) => trackEvent('outbound-link', { target });
</script>

<dialog
  bind:this={dialog}
  class="about"
  aria-labelledby="about-title"
  {onclose}
  onclick={(event) => {
    if (event.target === dialog) {
      dialog?.close();
    }
  }}
>
  <div class="body">
    <h2 id="about-title">About hmpg</h2>
    <p>A new tab page with a photo, a clock and the weather.</p>

    <h3>Photo</h3>
    {#if photo}
      <p>
        Taken by
        {#if photo.author_username}
          <a
            href={authorUrl(photo.author_username)}
            target="_blank"
            rel="noopener noreferrer"
            onclick={() => track('unsplash-author')}>{photo.author_name ?? photo.author_username}</a
          >
        {:else}
          {photo.author_name ?? 'an unknown photographer'}
        {/if}
        on
        <a
          href={photo.unsplash_id ? photoUrl(photo.unsplash_id) : `https://unsplash.com/${utm}`}
          target="_blank"
          rel="noopener noreferrer"
          onclick={() => track('unsplash')}>Unsplash</a
        >.
        {#if photo.author_instagram}
          <a
            href="https://instagram.com/{photo.author_instagram}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @{photo.author_instagram}"
            onclick={() => track('instagram')}>@{photo.author_instagram}</a
          >
        {/if}
      </p>
    {:else}
      <p>
        Photos come from
        <a
          href="https://unsplash.com/{utm}"
          target="_blank"
          rel="noopener noreferrer"
          onclick={() => track('unsplash')}>Unsplash</a
        >.
      </p>
    {/if}

    <h3>Weather</h3>
    <p>
      Weather data by
      <a
        href="https://open-meteo.com/"
        target="_blank"
        rel="noopener noreferrer"
        onclick={() => track('open-meteo')}>Open-Meteo.com</a
      >, under the
      <a
        href="https://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="noopener noreferrer"
        onclick={() => track('cc-by')}>CC BY 4.0</a
      >
      licence.
    </p>

    <div class="actions">
      <button class="close" type="button" onclick={() => dialog?.close()}>Close</button>
    </div>
  </div>
</dialog>

<style>
  .about {
    box-sizing: border-box;
    width: min(26rem, calc(100vw - 2.5rem));
    padding: 0;
    color: var(--snow, #f7f5f0);
    background: rgb(8 18 26 / 0.88);
    -webkit-backdrop-filter: blur(20px) saturate(1.3);
    backdrop-filter: blur(20px) saturate(1.3);
    border: 1px solid rgb(247 245 240 / 0.14);
    border-radius: 1.1rem;
    box-shadow: 0 18px 50px rgb(0 0 0 / 0.35);

    &::backdrop {
      background: rgb(0 0 0 / 0.45);
    }
  }

  .body {
    padding: 1.25rem 1.4rem 1.1rem;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  h2 {
    margin: 0 0 0.25rem;
    font-size: 1.2rem;
  }

  h3 {
    margin: 1rem 0 0.25rem;
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mist, #c9d3d6);
  }

  p {
    margin: 0;
  }

  a {
    color: var(--glacier, #9fe3e8);
    text-underline-offset: 0.15em;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.1rem;
  }

  .close {
    padding: 0.45rem 1rem;
    border: 1px solid rgb(247 245 240 / 0.2);
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;

    &:hover {
      background: rgb(247 245 240 / 0.1);
    }
  }
</style>
