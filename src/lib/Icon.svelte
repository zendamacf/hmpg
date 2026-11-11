<script lang="ts">
import type { WeatherIconName } from './weather';

export type IconName = 'map-marker' | 'camera' | 'instagram' | 'cog' | 'github' | WeatherIconName;

const iconClass: Record<IconName, string> = {
  'map-marker': 'fa-solid fa-location-dot',
  camera: 'fa-solid fa-camera',
  instagram: 'fa-brands fa-instagram',
  cog: 'fa-solid fa-gear',
  github: 'fa-brands fa-github',
  sun: 'fa-solid fa-sun',
  moon: 'fa-solid fa-moon',
  'cloud-sun': 'fa-solid fa-cloud-sun',
  'cloud-moon': 'fa-solid fa-cloud-moon',
  cloud: 'fa-solid fa-cloud',
  smog: 'fa-solid fa-smog',
  'cloud-rain': 'fa-solid fa-cloud-rain',
  'cloud-showers-heavy': 'fa-solid fa-cloud-showers-heavy',
  snowflake: 'fa-solid fa-snowflake',
  'cloud-bolt': 'fa-solid fa-cloud-bolt',
};

const { name, class: className = 'icon' }: { name: IconName; class?: string } = $props();
</script>

<i class="{iconClass[name]} {className}" aria-hidden="true"></i>
