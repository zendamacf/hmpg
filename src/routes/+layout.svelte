<script lang="ts">
import { PUBLIC_UMAMI_URL, PUBLIC_UMAMI_WEBSITE_ID } from '$app/env/public';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import '@fortawesome/fontawesome-free/css/brands.min.css';
import { umamiScriptSrc } from '#lib/umami.js';

const { children } = $props();

const umamiSrc = umamiScriptSrc(PUBLIC_UMAMI_URL);
const umamiWebsiteId = PUBLIC_UMAMI_WEBSITE_ID?.trim() ?? '';
</script>

<svelte:head>
  {#if umamiSrc && umamiWebsiteId}
    <script defer src={umamiSrc} data-website-id={umamiWebsiteId}></script>
  {/if}
</svelte:head>

{@render children()}
