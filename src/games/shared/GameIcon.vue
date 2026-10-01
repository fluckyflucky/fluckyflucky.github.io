<script setup lang="ts">
defineProps<{ name: 'settings' | 'pause' | 'play' | 'reset' | 'help' | 'close' | 'bot' | 'person' | 'chair' | 'undo' | 'hint' | 'arrow' | 'drop' | 'pencil' | 'eraser' | 'flag' | 'cell' }>()
const paths = {
  settings: 'M4 7h16M4 17h16M8 4v6m8 4v6M6 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0m8 10a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  pause: 'M8 5v14m8-14v14',
  play: 'm8 5 11 7-11 7Z',
  reset: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
  help: 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v.1M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  close: 'm6 6 12 12M18 6 6 18',
  bot: 'M12 3v3M7 6h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3M8 11v2m8-2v2m-7 4h6M1 11v5m22-5v5',
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
  chair: 'M6 13V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8M4 13h16v4H4Zm2 4v4m12-4v4',
  undo: 'm9 5-5 5 5 5M4 10h10a6 6 0 0 1 0 12',
  hint: 'M8 15a7 7 0 1 1 8 0l-1 3H9Zm1 6h6M12 5v3M4 3l2 2m14-2-2 2',
  arrow: 'M12 20V4m-7 7 7-7 7 7',
  drop: 'M12 3v11m-5-5 5 5 5-5M4 17v4h16v-4',
  pencil: 'm4 16 12-12 4 4-12 12-5 1Zm9-9 4 4M3 21h18',
  eraser: 'm3 14 10-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-9 9H9l-6-6a1 1 0 0 1 0-1Zm5-5 9 9M12 21h9',
  flag: 'M5 21V3m0 1h14l-3 4 3 4H5',
  cell: 'M3 3h18v18H3ZM3 9h18M3 15h18M9 3v18m6-18v18',
}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name]" /></svg></template>
<style scoped>svg { width: 24px; height: 24px; flex-shrink: 0; }</style>
