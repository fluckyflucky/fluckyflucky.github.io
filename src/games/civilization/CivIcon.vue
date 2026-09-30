<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 });
const paths: Record<string, string> = {
  food: "M12 21V8m0 7C5 15 3 11 4 5c6 0 8 4 8 10m0-3c0-6 4-9 9-9 1 6-3 9-9 9",
  production: "m4 18 8-8m-4-6 4-2 8 8-3 3-7-7-2-2m-5 16 4-4 3 3-4 4z",
  hammer: "m4 18 8-8m-4-6 4-2 8 8-3 3-7-7-2-2m-5 16 4-4 3 3-4 4z",
  science: "M9 3h6m-5 0v7L4 19q-1 2 2 2h12q3 0 2-2l-6-9V3M7 16h10m-8-3h2",
  culture:
    "M8 21V4l12-2v14m-12 1c-4-2-7 3-3 4 3 1 3-2 3-4m12-4c-4-2-7 3-3 4 3 1 3-2 3-4",
  gold: "M12 3c5 0 9 4 9 9s-4 9-9 9-9-4-9-9 4-9 9-9m0 4v10m3-8c-5-4-8 3-3 3s2 7-3 3",
  faith: "m12 2 2 7 7 3-7 2-2 8-2-8-8-2 8-3z",
  tourism: "M3 20V9h18v11H3m5-11V5h8v4m-3 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  sword: "m3 21 5-5m-4-4 8 8m-4-4L20 4V2h-2L6 14",
  bow: "M5 3c19 3 19 15 0 18L5 3m-3 9h20m-4-4 4 4-4 4",
  shield: "m12 2 9 4v7q-2 6-9 9-7-3-9-9V6z",
  city: "M3 21V9l4-5 4 5v12m0-13h10v13H3m12-10h2m-2 4h2m-10 1v5m-2-10h2",
  flag: "M5 22V2m0 1h14l-3 5 3 5H5",
  compass: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m5 5-3 7-7 3 3-7z",
  trade: "M2 8h19m-4-4 4 4-4 4M22 16H3m4-4-4 4 4 4",
  ship: "M2 16h20l-4 5H6zm10 0V2l8 10h-8m-2-9-6 9h6",
  siege:
    "M5 18h14l-2-6H7zm2 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-5-6V3l8 6",
  rocket:
    "M9 16c-6-4-1-11 3-14 5 3 9 10 3 14l-3 2zM8 11l-5 5 4 2m9-7 5 5-4 2m-7 1-1 4m5-4 1 4m-3-13h.01",
  wonder: "M2 21 12 3l10 18zm10-18 3 18M8 14h9",
  happy:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M7 14q5 6 10 0M8 8h.01M16 8h.01",
  globe:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 0c-6 5-6 15 0 20 6-5 6-15 0-20M2 12h20",
  scroll: "M5 4h14v16H5zm3 4h8m-8 4h8m-8 4h5",
  gear: "M9 3h6l1 4 4 1 1 6-4 2-1 4H9l-1-4-4-2 1-6 4-1zm3 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  save: "M3 3h15l3 3v15H3zm4 0v7h10V3M7 21v-7h10v7",
  arrow: "M3 12h18m-6-6 6 6-6 6",
  check: "m4 12 5 5L21 5",
  close: "m5 5 14 14M19 5 5 19",
  plus: "M12 4v16M4 12h16",
  minus: "M4 12h16",
  eye: "M2 12c5-10 15-10 20 0-5 10-15 10-20 0m10-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
  mountain: "m2 21 8-18 5 11 3-6 5 13zM7 9l3 2 2-3",
  water: "M2 7q3-4 6 0t6 0 6 0M2 13q3-4 6 0t6 0 6 0M2 19q3-4 6 0t6 0 6 0",
  tree: "m12 2-7 8h4l-6 7h7v5h4v-5h7l-6-7h4z",
  help: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M9 8c0-4 7-4 7 0 0 2-4 2-4 5m0 4h.01",
};
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] ?? paths.city" />
  </svg>
</template>
