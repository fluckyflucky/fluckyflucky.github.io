<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  data: unknown
  depth?: number
}>()

const depth = props.depth ?? 0
const expanded = ref(true)

const bracketColorDefs = [
  { text: 'text-sky-400',   hex: '#38bdf840' },
  { text: 'text-amber-400', hex: '#fbbf2440' },
  { text: 'text-emerald-400', hex: '#34d39940' },
  { text: 'text-purple-400', hex: '#a78bfa40' },
  { text: 'text-rose-400',  hex: '#fb718540' },
  { text: 'text-cyan-400',  hex: '#22d3ee40' },
]
const def = bracketColorDefs[depth % bracketColorDefs.length]
const bracketColor = def.text
const bracketBorderColor = def.hex

const type = Array.isArray(props.data)
  ? 'array'
  : props.data !== null && typeof props.data === 'object'
    ? 'object'
    : 'primitive'

function toggle() {
  if (type !== 'primitive') expanded.value = !expanded.value
}

function entryCount(): number {
  if (type === 'array') return (props.data as unknown[]).length
  if (type === 'object') return Object.keys(props.data as Record<string, unknown>).length
  return 0
}

function summary(): string {
  const count = entryCount()
  const unit = type === 'array' ? 'items' : 'keys'
  return `${count} ${unit}`
}
</script>

<template>
  <!-- Primitives -->
  <span v-if="type === 'primitive'">
    <span v-if="typeof data === 'string'" class="text-emerald-400">"{{ data }}"</span>
    <span v-else-if="typeof data === 'number'" class="text-orange-400">{{ data }}</span>
    <span v-else-if="typeof data === 'boolean'" class="text-purple-400">{{ data }}</span>
    <span v-else-if="data === null" class="text-stone-500">null</span>
    <span v-else class="text-stone-300">{{ data }}</span>
  </span>

  <!-- Object -->
  <span v-else-if="type === 'object'">
    <span
      class="cursor-pointer select-none hover:text-stone-200 inline-flex items-center gap-1"
      @click="toggle"
    >
      <span class="inline-block w-3 text-xs leading-none text-stone-400">{{ expanded ? '▾' : '▸' }}</span>
      <span :class="bracketColor">{{ '{' }}</span>
      <span v-if="!expanded" class="text-stone-500 text-xs">{{ summary() }}</span>
      <span v-if="!expanded" :class="bracketColor">}</span>
    </span>
    <span v-if="expanded" class="block border-l" :style="{ paddingLeft: '1.25rem', borderColor: bracketBorderColor }">
      <div
        v-for="(value, key, index) in (data as Record<string, unknown>)"
        :key="key"
      >
        <span class="text-sky-400">"{{ key }}"</span
        ><span class="text-stone-400">: </span>
        <JsonNode :data="value" :depth="depth + 1" />
        <span v-if="index < entryCount() - 1" class="text-stone-500">,</span>
      </div>
    </span>
    <span
      v-if="expanded"
      class="cursor-pointer select-none hover:text-stone-200"
      :class="bracketColor"
      @click="toggle"
    >}</span>
  </span>

  <!-- Array -->
  <span v-else-if="type === 'array'">
    <span
      class="cursor-pointer select-none hover:text-stone-200 inline-flex items-center gap-1"
      @click="toggle"
    >
      <span class="inline-block w-3 text-xs leading-none text-stone-400">{{ expanded ? '▾' : '▸' }}</span>
      <span :class="bracketColor">{{ '[' }}</span>
      <span v-if="!expanded" class="text-stone-500 text-xs">{{ summary() }}</span>
      <span v-if="!expanded" :class="bracketColor">]</span>
    </span>
    <span v-if="expanded" class="block border-l" :style="{ paddingLeft: '1.25rem', borderColor: bracketBorderColor }">
      <div
        v-for="(item, index) in (data as unknown[])"
        :key="index"
      >
        <JsonNode :data="item" :depth="depth + 1" />
        <span v-if="index < entryCount() - 1" class="text-stone-500">,</span>
      </div>
    </span>
    <span
      v-if="expanded"
      class="cursor-pointer select-none hover:text-stone-200"
      :class="bracketColor"
      @click="toggle"
    >]</span>
  </span>
</template>
