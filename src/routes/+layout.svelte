<script lang="ts">
import { env } from '$env/dynamic/public';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import { umamiScriptSrc } from '$lib/umami';

const { children } = $props();

const umamiSrc = umamiScriptSrc(env.PUBLIC_UMAMI_URL);
const umamiWebsiteId = env.PUBLIC_UMAMI_WEBSITE_ID?.trim() ?? '';
</script>

<svelte:head>
  {#if umamiSrc && umamiWebsiteId}
    <script defer src={umamiSrc} data-website-id={umamiWebsiteId}></script>
  {/if}
</svelte:head>

{@render children()}
