<script lang="ts">
export type IconName =
  | 'map-marker'
  | 'camera'
  | 'instagram'
  | 'cog'
  | 'github'
  | 'pin'
  | 'heart'
  | 'heart-outline';

const iconClass: Record<IconName, string> = {
  pin: 'fa-solid fa-thumbtack',
  heart: 'fa-solid fa-heart',
  'heart-outline': 'fa-regular fa-heart',
  'map-marker': 'fa-solid fa-location-dot',
  camera: 'fa-solid fa-camera',
  instagram: 'fa-brands fa-instagram',
  cog: 'fa-solid fa-gear',
  github: 'fa-brands fa-github',
};

const { name, class: className = 'icon' }: { name: IconName; class?: string } = $props();
</script>

<i class="{iconClass[name]} {className}" aria-hidden="true"></i>
