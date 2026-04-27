---
title: 下载速度计算
---

# 下载速度计算

<script setup>
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
const allSpeedUnits = [...speedUnitsb, ...speedUnitsB]
const timeUnits = ['s', 'min', 'h', 'd']

const timeUnitLabels = { s: '秒', min: '分钟', h: '小时', d: '天' }

function toBytes(val, unit) {
  const map = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3, TB: 1024**4 }
  return val * (map[unit] || 1)
}

function toBytesPerSec(val, unit) {
  const map = {
    'bps': 1/8, 'Kbps': 1000/8, 'Mbps': 1e6/8, 'Gbps': 1e9/8,
    'B/s': 1, 'KB/s': 1024, 'MB/s': 1024**2, 'GB/s': 1024**3,
  }
  return val * (map[unit] || 1)
}

function toSeconds(val, unit) {
  const map = { s: 1, min: 60, h: 3600, d: 86400 }
  return val * (map[unit] || 1)
}

function formatTime(sec) {
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

function formatSize(bytes) {
  if (bytes < 1024) return bytes.toFixed(2) + ' B'
  if (bytes < 1024**2) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024**3) return (bytes / 1024**2).toFixed(2) + ' MB'
  if (bytes < 1024**4) return (bytes / 1024**3).toFixed(2) + ' GB'
  return (bytes / 1024**4).toFixed(2) + ' TB'
}

function formatSpeed(bps) {
  if (bps < 1024) return bps.toFixed(2) + ' B/s'
  if (bps < 1024**2) return (bps / 1024).toFixed(2) + ' KB/s'
  if (bps < 1024**3) return (bps / 1024**2).toFixed(2) + ' MB/s'
  return (bps / 1024**3).toFixed(2) + ' GB/s'
}

function formatSpeedBits(bps) {
  const bits = bps * 8
  if (bits < 1000) return bits.toFixed(2) + ' bps'
  if (bits < 1e6) return (bits / 1000).toFixed(2) + ' Kbps'
  if (bits < 1e9) return (bits / 1e6).toFixed(2) + ' Mbps'
  return (bits / 1e9).toFixed(2) + ' Gbps'
}

const mode = ref('time')

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
      detail: `${formatSize(bytes)} ÷ ${formatSpeed(bps)} (${formatSpeedBits(bps)})`
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
      detail: `${formatSpeed(bps)} (${formatSpeedBits(bps)}) × ${formatTime(sec)}`
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
      detail: `${formatSize(bytes)} ÷ ${formatTime(sec)}`
    }
  }
  return null
})

function copyText(text) { navigator.clipboard.writeText(String(text)) }
</script>

<ClientOnly>
<div class="calc-page">

<div class="mode-bar">
  <button v-for="m in [{k:'time',l:'算时间'},{k:'size',l:'算大小'},{k:'speed',l:'算速度'}]"
    :key="m.k" :class="['mode-btn', { active: mode === m.k }]"
    @click="mode = m.k">{{ m.l }}</button>
</div>

<div class="cards">
<div class="card" v-if="mode !== 'size'">
  <div class="card-header">文件大小</div>
  <div class="input-row">
    <input v-model="fileSize" class="calc-input" type="number" min="0" placeholder="输入大小" />
    <select v-model="fileSizeUnit" class="calc-select">
      <option v-for="u in fileSizeUnits" :key="u" :value="u">{{ u }}</option>
    </select>
  </div>
</div>

<div class="card" v-if="mode !== 'speed'">
  <div class="card-header">下载速度</div>
  <div class="input-row">
    <input v-model="speed" class="calc-input" type="number" min="0" placeholder="输入速度" />
    <select v-model="speedUnit" class="calc-select">
      <optgroup label="比特 (bit)">
        <option v-for="u in speedUnitsb" :key="u" :value="u">{{ u }}</option>
      </optgroup>
      <optgroup label="字节 (Byte)">
        <option v-for="u in speedUnitsB" :key="u" :value="u">{{ u }}</option>
      </optgroup>
    </select>
  </div>
</div>

<div class="card" v-if="mode !== 'time'">
  <div class="card-header">下载时间</div>
  <div class="input-row">
    <input v-model="time" class="calc-input" type="number" min="0" placeholder="输入时间" />
    <select v-model="timeUnit" class="calc-select">
      <option v-for="u in timeUnits" :key="u" :value="u">{{ timeUnitLabels[u] }}</option>
    </select>
  </div>
</div>
</div>

<div v-if="result" class="result-card">
  <div class="result-row" v-if="result.time">
    <span class="result-label">下载时间</span>
    <span class="result-value copyable" @click="copyText(result.time)">{{ result.time }}</span>
  </div>
  <div class="result-row" v-if="result.seconds">
    <span class="result-label">总秒数</span>
    <span class="result-value copyable" @click="copyText(result.seconds)">{{ result.seconds }} s</span>
  </div>
  <div class="result-row" v-if="result.size">
    <span class="result-label">文件大小</span>
    <span class="result-value copyable" @click="copyText(result.size)">{{ result.size }}</span>
  </div>
  <div class="result-row" v-if="result.bytes">
    <span class="result-label">字节数</span>
    <span class="result-value copyable" @click="copyText(result.bytes)">{{ result.bytes }} B</span>
  </div>
  <div class="result-row" v-if="result.speed">
    <span class="result-label">速度 (Byte)</span>
    <span class="result-value copyable" @click="copyText(result.speed)">{{ result.speed }}</span>
  </div>
  <div class="result-row" v-if="result.speedBits">
    <span class="result-label">速度 (bit)</span>
    <span class="result-value copyable" @click="copyText(result.speedBits)">{{ result.speedBits }}</span>
  </div>
  <div class="result-row" v-if="result.detail">
    <span class="result-label">计算过程</span>
    <span class="result-value detail">{{ result.detail }}</span>
  </div>
</div>

</div>
</ClientOnly>

<style scoped>
.calc-page { margin-top: 16px; }
.mode-bar {
  display: flex; gap: 8px; margin-bottom: 20px;
}
.mode-btn {
  padding: 8px 20px; border-radius: 8px; border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); cursor: pointer;
  font-size: 14px; font-weight: 500; transition: all 0.2s;
}
.mode-btn:hover { border-color: var(--vp-c-brand-1); }
.mode-btn.active {
  background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1);
}
.cards { display: flex; gap: 16px; flex-wrap: wrap; }
.card {
  flex: 1; min-width: 200px; padding: 20px; border-radius: 12px;
  border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft);
}
.card-header {
  font-weight: 700; font-size: 15px; margin-bottom: 12px;
  color: var(--vp-c-brand-1);
}
.input-row { display: flex; gap: 8px; }
.calc-input {
  flex: 1; font-family: monospace; font-size: 13px; padding: 10px 12px;
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  background: var(--vp-c-bg); color: var(--vp-c-text-1);
}
.calc-select {
  width: 100px; font-size: 13px; padding: 10px 8px;
  border: 1px solid var(--vp-c-divider); border-radius: 8px;
  background: var(--vp-c-bg); color: var(--vp-c-text-1);
}
.result-card {
  margin-top: 20px; padding: 16px 20px; border-radius: 12px;
  border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft);
}
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
.detail { font-size: 12px; color: var(--vp-c-text-3); }
@media (max-width: 640px) { .cards { flex-direction: column; } }
</style>
