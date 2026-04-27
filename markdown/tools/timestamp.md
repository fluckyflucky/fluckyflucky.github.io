---
title: 时间戳转换
---

# 时间戳转换

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const now = ref(0)
let timer = null

onMounted(() => {
  now.value = Math.floor(Date.now() / 1000)
  timer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 1000)
})

onUnmounted(() => { if (timer) clearInterval(timer) })

const days = ['日', '一', '二', '三', '四', '五', '六']

const nowFormatted = computed(() => {
  if (!now.value) return ''
  const d = new Date(now.value * 1000)
  return d.toLocaleString('zh-CN', { hour12: false, weekday: 'long' })
})

const tsInput = ref('')
const dtInput = ref('')

function relative(ts) {
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

function copyText(text) { navigator.clipboard.writeText(String(text)) }
</script>

<ClientOnly>
<div class="ts-page">
<div class="now-bar">
<span class="now-label">当前时间</span>
<code class="now-ts" @click="useNow" title="点击填入输入框">{{ now }}</code>
<span class="now-date">{{ nowFormatted }}</span>
</div>
<div class="cards">
<div class="card">
<div class="card-header">时间戳 → 日期</div>
<input v-model="tsInput" class="ts-input" placeholder="输入秒级或毫秒级时间戳" />
<div v-if="tsResult && !tsResult.error" class="result-card">
<div class="result-row">
<span class="result-label">本地时间</span>
<span class="result-value">{{ tsResult.local }}</span>
</div>
<div class="result-row">
<span class="result-label">ISO 8601</span>
<span class="result-value copyable" @click="copyText(tsResult.iso)">{{ tsResult.iso }}</span>
</div>
<div class="result-row">
<span class="result-label">星期</span>
<span class="result-value">{{ tsResult.weekday }}</span>
</div>
<div class="result-row">
<span class="result-label">相对时间</span>
<span class="result-value">{{ tsResult.relative }}</span>
</div>
</div>
<p v-if="tsResult && tsResult.error" class="tool-error">{{ tsResult.error }}</p>
</div>
<div class="card">
<div class="card-header">日期 → 时间戳</div>
<input v-model="dtInput" type="datetime-local" class="ts-input" />
<div v-if="dtResult && !dtResult.error" class="result-card">
<div class="result-row">
<span class="result-label">秒级</span>
<span class="result-value copyable" @click="copyText(dtResult.seconds)">{{ dtResult.seconds }}</span>
</div>
<div class="result-row">
<span class="result-label">毫秒级</span>
<span class="result-value copyable" @click="copyText(dtResult.milliseconds)">{{ dtResult.milliseconds }}</span>
</div>
<div class="result-row">
<span class="result-label">星期</span>
<span class="result-value">{{ dtResult.weekday }}</span>
</div>
<div class="result-row">
<span class="result-label">相对时间</span>
<span class="result-value">{{ dtResult.relative }}</span>
</div>
</div>
<p v-if="dtResult && dtResult.error" class="tool-error">{{ dtResult.error }}</p>
</div>
</div>
</div>
</ClientOnly>

<style scoped>
.ts-page { margin-top: 16px; }
.now-bar {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  background: var(--vp-c-bg-soft); border-radius: 10px; margin-bottom: 20px; flex-wrap: wrap;
}
.now-label { font-weight: 600; color: var(--vp-c-brand-1); }
.now-ts {
  font-family: monospace; font-size: 15px; padding: 2px 10px;
  background: var(--vp-c-bg-mute); border-radius: 4px; cursor: pointer;
  transition: background 0.2s;
}
.now-ts:hover { background: var(--vp-c-brand-1); color: #fff; }
.now-date { color: var(--vp-c-text-2); font-size: 14px; }
.cards { display: flex; gap: 16px; }
.card {
  flex: 1; padding: 20px; border-radius: 12px;
  border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft);
}
.card-header {
  font-weight: 700; font-size: 15px; margin-bottom: 12px;
  color: var(--vp-c-brand-1);
}
.ts-input {
  width: 100%; font-family: monospace; font-size: 13px; padding: 10px 12px;
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  background: var(--vp-c-bg); color: var(--vp-c-text-1);
}
.result-card { margin-top: 14px; }
.result-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--vp-c-divider);
}
.result-row:last-child { border-bottom: none; }
.result-label { font-size: 13px; color: var(--vp-c-text-2); }
.result-value { font-family: monospace; font-size: 13px; }
.copyable {
  cursor: pointer; padding: 2px 6px; border-radius: 4px;
  transition: background 0.2s;
}
.copyable:hover { background: var(--vp-c-brand-1); color: #fff; }
.tool-error { color: #ef4444; margin-top: 8px; font-size: 13px; }
@media (max-width: 640px) { .cards { flex-direction: column; } }
</style>
