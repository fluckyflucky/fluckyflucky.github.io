<script setup lang="ts">
import { ref, computed } from 'vue'

const fileSize = ref('')
const fileSizeUnit = ref('MB')
const speed = ref('')
const speedUnit = ref('Mbps')
const time = ref('')
const timeUnit = ref('s')

const fileSizeUnits = ['B', 'KB', 'MB', 'GB', 'TB']
const speedUnitsB = ['B/s', 'KB/s', 'MB/s', 'GB/s']
const speedUnitsb = ['bps', 'Kbps', 'Mbps', 'Gbps']
const timeUnits = ['s', 'min', 'h', 'd']

const timeUnitLabels: Record<string, string> = { s: '秒', min: '分钟', h: '小时', d: '天' }

function toBytes(val: number, unit: string) {
  const map: Record<string, number> = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3, TB: 1024**4 }
  return val * (map[unit] || 1)
}

function toBytesPerSec(val: number, unit: string) {
  const map: Record<string, number> = {
    'bps': 1/8, 'Kbps': 1000/8, 'Mbps': 1e6/8, 'Gbps': 1e9/8,
    'B/s': 1, 'KB/s': 1024, 'MB/s': 1024**2, 'GB/s': 1024**3,
  }
  return val * (map[unit] || 1)
}

function toSeconds(val: number, unit: string) {
  const map: Record<string, number> = { s: 1, min: 60, h: 3600, d: 86400 }
  return val * (map[unit] || 1)
}

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return null
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = (sec % 60).toFixed(1)
  const parts = []
  if (d > 0) parts.push(d + ' 天')
  if (h > 0) parts.push(h + ' 小时')
  if (m > 0) parts.push(m + ' 分钟')
  if (parseFloat(s) > 0 || parts.length === 0) parts.push(s + ' 秒')
  return parts.join(' ')
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes.toFixed(2) + ' B'
  if (bytes < 1024**2) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024**3) return (bytes / 1024**2).toFixed(2) + ' MB'
  if (bytes < 1024**4) return (bytes / 1024**3).toFixed(2) + ' GB'
  return (bytes / 1024**4).toFixed(2) + ' TB'
}

function formatSpeed(bps: number) {
  if (bps < 1024) return bps.toFixed(2) + ' B/s'
  if (bps < 1024**2) return (bps / 1024).toFixed(2) + ' KB/s'
  if (bps < 1024**3) return (bps / 1024**2).toFixed(2) + ' MB/s'
  return (bps / 1024**3).toFixed(2) + ' GB/s'
}

function formatSpeedBits(bps: number) {
  const bits = bps * 8
  if (bits < 1000) return bits.toFixed(2) + ' bps'
  if (bits < 1e6) return (bits / 1000).toFixed(2) + ' Kbps'
  if (bits < 1e9) return (bits / 1e6).toFixed(2) + ' Mbps'
  return (bits / 1e9).toFixed(2) + ' Gbps'
}

const mode = ref<'time' | 'size' | 'speed'>('time')

const result = computed(() => {
  if (mode.value === 'time') {
    const f = Number(fileSize.value)
    const s = Number(speed.value)
    if (!f || !s || f <= 0 || s <= 0) return null
    const bytes = toBytes(f, fileSizeUnit.value)
    const bps = toBytesPerSec(s, speedUnit.value)
    const sec = bytes / bps
    return {
      time: formatTime(sec),
      seconds: sec.toFixed(2),
      detail: `${formatSize(bytes)} / ${formatSpeed(bps)} (${formatSpeedBits(bps)})`
    }
  }
  if (mode.value === 'size') {
    const s = Number(speed.value)
    const t = Number(time.value)
    if (!s || !t || s <= 0 || t <= 0) return null
    const bps = toBytesPerSec(s, speedUnit.value)
    const sec = toSeconds(t, timeUnit.value)
    const bytes = bps * sec
    return {
      size: formatSize(bytes),
      bytes: bytes.toFixed(0),
      detail: `${formatSpeed(bps)} (${formatSpeedBits(bps)}) x ${formatTime(sec)}`
    }
  }
  if (mode.value === 'speed') {
    const f = Number(fileSize.value)
    const t = Number(time.value)
    if (!f || !t || f <= 0 || t <= 0) return null
    const bytes = toBytes(f, fileSizeUnit.value)
    const sec = toSeconds(t, timeUnit.value)
    const bps = bytes / sec
    return {
      speed: formatSpeed(bps),
      speedBits: formatSpeedBits(bps),
      detail: `${formatSize(bytes)} / ${formatTime(sec)}`
    }
  }
  return null
})

async function copyText(text: string) { await navigator.clipboard.writeText(String(text)) }

const modes = [
  { key: 'time' as const, label: '算时间' },
  { key: 'size' as const, label: '算大小' },
  { key: 'speed' as const, label: '算速度' },
]
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-stone-100">下载速度计算</h1>

    <div class="flex gap-2 mb-5">
      <button
        v-for="m in modes" :key="m.key"
        @click="mode = m.key"
        :class="[
          'px-5 py-2 rounded-lg text-sm font-medium transition border',
          mode === m.key
            ? 'bg-sky-600 text-white border-sky-600'
            : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-sky-600'
        ]"
      >{{ m.label }}</button>
    </div>

    <div class="flex gap-4 flex-wrap">
      <div v-if="mode !== 'size'" class="flex-1 min-w-52 p-5 border border-stone-700 rounded-xl bg-stone-900">
        <div class="font-bold text-sm mb-3 text-sky-400">文件大小</div>
        <div class="flex gap-2">
          <input v-model="fileSize" type="number" min="0" placeholder="输入大小" class="flex-1 font-mono text-sm p-2.5 border border-stone-700 rounded-lg bg-stone-950 text-stone-200 focus:outline-none focus:border-sky-600" />
          <select v-model="fileSizeUnit" class="w-24 text-sm p-2.5 border border-stone-700 rounded-lg bg-stone-950 text-stone-200 focus:outline-none">
            <option v-for="u in fileSizeUnits" :key="u" :value="u">{{ u }}</option>
          </select>
        </div>
      </div>

      <div v-if="mode !== 'speed'" class="flex-1 min-w-52 p-5 border border-stone-700 rounded-xl bg-stone-900">
        <div class="font-bold text-sm mb-3 text-sky-400">下载速度</div>
        <div class="flex gap-2">
          <input v-model="speed" type="number" min="0" placeholder="输入速度" class="flex-1 font-mono text-sm p-2.5 border border-stone-700 rounded-lg bg-stone-950 text-stone-200 focus:outline-none focus:border-sky-600" />
          <select v-model="speedUnit" class="w-24 text-sm p-2.5 border border-stone-700 rounded-lg bg-stone-950 text-stone-200 focus:outline-none">
            <optgroup label="比特 (bit)">
              <option v-for="u in speedUnitsb" :key="u" :value="u">{{ u }}</option>
            </optgroup>
            <optgroup label="字节 (Byte)">
              <option v-for="u in speedUnitsB" :key="u" :value="u">{{ u }}</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div v-if="mode !== 'time'" class="flex-1 min-w-52 p-5 border border-stone-700 rounded-xl bg-stone-900">
        <div class="font-bold text-sm mb-3 text-sky-400">下载时间</div>
        <div class="flex gap-2">
          <input v-model="time" type="number" min="0" placeholder="输入时间" class="flex-1 font-mono text-sm p-2.5 border border-stone-700 rounded-lg bg-stone-950 text-stone-200 focus:outline-none focus:border-sky-600" />
          <select v-model="timeUnit" class="w-24 text-sm p-2.5 border border-stone-700 rounded-lg bg-stone-950 text-stone-200 focus:outline-none">
            <option v-for="u in timeUnits" :key="u" :value="u">{{ timeUnitLabels[u] }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="result" class="mt-5 p-4 border border-stone-700 rounded-xl bg-stone-900">
      <div v-for="item in [
        ...(result.time ? [{ label: '下载时间', value: result.time, copy: true }] : []),
        ...(result.seconds ? [{ label: '总秒数', value: result.seconds + ' s', copy: true }] : []),
        ...(result.size ? [{ label: '文件大小', value: result.size, copy: true }] : []),
        ...(result.bytes ? [{ label: '字节数', value: result.bytes + ' B', copy: true }] : []),
        ...(result.speed ? [{ label: '速度 (Byte)', value: result.speed, copy: true }] : []),
        ...(result.speedBits ? [{ label: '速度 (bit)', value: result.speedBits, copy: true }] : []),
        ...(result.detail ? [{ label: '计算过程', value: result.detail, copy: false }] : []),
      ]" :key="item.label" class="flex justify-between items-center py-2 border-b border-stone-800 last:border-b-0">
        <span class="text-sm text-stone-400">{{ item.label }}</span>
        <span
          :class="['font-mono text-sm', item.copy && 'cursor-pointer px-1.5 rounded hover:bg-sky-600 hover:text-white transition', !item.copy && 'text-stone-500']"
          @click="item.copy && copyText(item.value!)"
        >{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>
