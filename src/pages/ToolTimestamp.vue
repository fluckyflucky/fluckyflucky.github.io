<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const now = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  now.value = Math.floor(Date.now() / 1000)
  timer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 1000)
})

onUnmounted(() => { if (timer) clearInterval(timer) })

const days = ['日', '一', '二', '三', '四', '五', '六']

const nowFormatted = computed(() => {
  if (!now.value) return ''
  return new Date(now.value * 1000).toLocaleString('zh-CN', { hour12: false, weekday: 'long' })
})

const tsInput = ref('')
const dtInput = ref('')

function relative(ts: number) {
  const diff = now.value - ts
  const abs = Math.abs(diff)
  const suffix = diff >= 0 ? '前' : '后'
  if (abs < 60) return abs + ' 秒' + suffix
  if (abs < 3600) return Math.floor(abs / 60) + ' 分钟' + suffix
  if (abs < 86400) return Math.floor(abs / 3600) + ' 小时' + suffix
  if (abs < 2592000) return Math.floor(abs / 86400) + ' 天' + suffix
  if (abs < 31536000) return Math.floor(abs / 2592000) + ' 个月' + suffix
  return Math.floor(abs / 31536000) + ' 年' + suffix
}

const tsResult = computed(() => {
  if (!tsInput.value) return null
  const n = Number(tsInput.value)
  if (isNaN(n)) return { error: '请输入有效数字' }
  const ms = n > 1e12 ? n : n * 1000
  const sec = n > 1e12 ? Math.floor(n / 1000) : n
  const d = new Date(ms)
  if (isNaN(d.getTime())) return { error: '无效时间戳' }
  return {
    local: d.toLocaleString('zh-CN', { hour12: false }),
    iso: d.toISOString(),
    weekday: '星期' + days[d.getDay()],
    relative: relative(sec),
  }
})

const dtResult = computed(() => {
  if (!dtInput.value) return null
  const d = new Date(dtInput.value)
  if (isNaN(d.getTime())) return { error: '请输入有效日期' }
  const sec = Math.floor(d.getTime() / 1000)
  return {
    seconds: sec,
    milliseconds: d.getTime(),
    weekday: '星期' + days[d.getDay()],
    relative: relative(sec),
  }
})

function useNow() { tsInput.value = String(now.value) }

async function copyText(text: string | number) { await navigator.clipboard.writeText(String(text)) }
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-stone-100">时间戳转换</h1>

    <div class="flex items-center gap-3 p-3 bg-stone-900 rounded-lg mb-5 flex-wrap">
      <span class="font-semibold text-sky-400 text-sm">当前时间</span>
      <code
        @click="useNow"
        title="点击填入输入框"
        class="font-mono text-sm px-2.5 py-0.5 bg-stone-800 rounded cursor-pointer hover:bg-sky-600 hover:text-white transition"
      >{{ now }}</code>
      <span class="text-stone-400 text-sm">{{ nowFormatted }}</span>
    </div>

    <div class="flex gap-4 flex-col md:flex-row">
      <div class="flex-1 p-5 border border-stone-700 rounded-xl bg-stone-900">
        <div class="font-bold text-sm mb-3 text-sky-400">时间戳 → 日期</div>
        <input v-model="tsInput" class="w-full font-mono text-sm p-2.5 border border-stone-700 rounded-lg bg-stone-950 text-stone-200 mb-3 focus:outline-none focus:border-sky-600" placeholder="输入秒级或毫秒级时间戳" />
        <div v-if="tsResult && !tsResult.error" class="space-y-2">
          <div v-for="item in [
            { label: '本地时间', value: tsResult.local },
            { label: 'ISO 8601', value: tsResult.iso, copy: true },
            { label: '星期', value: tsResult.weekday },
            { label: '相对时间', value: tsResult.relative },
          ]" :key="item.label" class="flex justify-between items-center py-2 border-b border-stone-800 last:border-b-0">
            <span class="text-sm text-stone-400">{{ item.label }}</span>
            <span
              :class="['font-mono text-sm', item.copy && 'cursor-pointer px-1.5 rounded hover:bg-sky-600 hover:text-white transition']"
              @click="item.copy && copyText(item.value!)"
            >{{ item.value }}</span>
          </div>
        </div>
        <p v-if="tsResult && tsResult.error" class="text-red-400 text-sm mt-2">{{ tsResult.error }}</p>
      </div>

      <div class="flex-1 p-5 border border-stone-700 rounded-xl bg-stone-900">
        <div class="font-bold text-sm mb-3 text-sky-400">日期 → 时间戳</div>
        <input v-model="dtInput" type="datetime-local" class="w-full font-mono text-sm p-2.5 border border-stone-700 rounded-lg bg-stone-950 text-stone-200 mb-3 focus:outline-none focus:border-sky-600" />
        <div v-if="dtResult && !dtResult.error" class="space-y-2">
          <div v-for="item in [
            { label: '秒级', value: dtResult.seconds, copy: true },
            { label: '毫秒级', value: dtResult.milliseconds, copy: true },
            { label: '星期', value: dtResult.weekday },
            { label: '相对时间', value: dtResult.relative },
          ]" :key="item.label" class="flex justify-between items-center py-2 border-b border-stone-800 last:border-b-0">
            <span class="text-sm text-stone-400">{{ item.label }}</span>
            <span
              :class="['font-mono text-sm', item.copy && 'cursor-pointer px-1.5 rounded hover:bg-sky-600 hover:text-white transition']"
              @click="item.copy && copyText(item.value!)"
            >{{ item.value }}</span>
          </div>
        </div>
        <p v-if="dtResult && dtResult.error" class="text-red-400 text-sm mt-2">{{ dtResult.error }}</p>
      </div>
    </div>
  </div>
</template>
