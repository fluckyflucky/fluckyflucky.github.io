<script setup lang="ts">
import { computed } from 'vue'
import { cells, type Kind } from './logic'
const props = defineProps<{ kind: Kind | null }>()
const squares = computed(() => {
  if (!props.kind) return []
  const list = cells({ kind: props.kind, rotation: 0, x: 0, y: 0 })
  const minX = Math.min(...list.map(p => p.x)), maxX = Math.max(...list.map(p => p.x))
  const minY = Math.min(...list.map(p => p.y))
  return list.map(p => ({ x: (p.x - minX) * 12 + (48 - (maxX - minX + 1) * 12) / 2, y: (p.y - minY) * 12 + 8 }))
})
</script>
<template><svg viewBox="0 0 48 40" aria-hidden="true"><rect v-for="(p, i) in squares" :key="i" :x="p.x + .5" :y="p.y + .5" width="11" height="11" rx="1.5" fill="#164e63" stroke="#67e8f9" /></svg></template>
