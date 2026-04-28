<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vitepress'

interface LyricPair {
  ja: string
  zh: string
  song: string
}

interface FallingItem {
  id: number
  lyric: LyricPair
  el: HTMLElement | null
  startTime: number
  duration: number
  x: number
  scale: number
  swayAmp: number
  swayFreq: number
  rotateAmp: number
  rotateFreq: number
}

const route = useRoute()
const container = ref<HTMLElement | null>(null)
const lyrics = ref<LyricPair[]>([])
const items: FallingItem[] = []
let spawnTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null
let nextId = 0
let idx = 0

const isHome = () => route.path === '/' || route.path === '/index' || route.path === '/index.html'
const isMobile = () => window.innerWidth < 768

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function createEl(lyric: LyricPair, scale: number): HTMLElement {
  const div = document.createElement('div')
  div.className = 'lyric-item'
  div.innerHTML = `<div class="lyric-ja">${lyric.ja}</div><div class="lyric-zh">${lyric.zh}</div>`
  div.style.transform = `scale(${scale})`
  return div
}

function spawnLyric() {
  if (!isHome() || !container.value || lyrics.value.length === 0) return
  const maxItems = isMobile() ? 3 : 5
  if (items.length >= maxItems) {
    scheduleNext()
    return
  }

  const lyric = lyrics.value[idx % lyrics.value.length]
  idx++
  if (idx >= lyrics.value.length) {
    idx = 0
    shuffle(lyrics.value)
  }

  const scale = isMobile() ? 0.7 + Math.random() * 0.2 : 0.85 + Math.random() * 0.35
  const el = createEl(lyric, scale)
  container.value.appendChild(el)

  const mobile = isMobile()
  const item: FallingItem = {
    id: nextId++,
    lyric,
    el,
    startTime: performance.now(),
    duration: (9 + Math.random() * 4) * 1000,
    x: mobile ? 5 + Math.random() * 90 : 10 + Math.random() * 80,
    scale,
    swayAmp: mobile ? 8 + Math.random() * 15 : 15 + Math.random() * 30,
    swayFreq: 0.8 + Math.random() * 0.6,
    rotateAmp: mobile ? 5 + Math.random() * 10 : 10 + Math.random() * 20,
    rotateFreq: 0.6 + Math.random() * 0.8,
  }
  items.push(item)
  scheduleNext()
}

function scheduleNext() {
  const delay = 1500 + Math.random() * 1500
  spawnTimer = setTimeout(spawnLyric, delay)
}

function animate(now: number) {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    if (!item.el) continue

    const elapsed = now - item.startTime
    const t = Math.min(elapsed / item.duration, 1) // 0→1 progress

    if (t >= 1) {
      item.el.remove()
      items.splice(i, 1)
      continue
    }

    // vertical: ease-in slightly (quadratic blend)
    const y = t * (0.7 + 0.3 * t) * 90 // 0→~90vh with slight acceleration

    // horizontal sway: sine wave
    const swayX = Math.sin(t * item.swayFreq * Math.PI * 2) * item.swayAmp

    // rotation: sine wave at different frequency, creates natural offset
    const rotate = Math.sin(t * item.rotateFreq * Math.PI * 2 + 0.5) * item.rotateAmp

    // opacity: fade in quickly, hold, fade out in last 30%
    let opacity: number
    if (t < 0.08) {
      opacity = t / 0.08 * 0.65
    } else if (t < 0.7) {
      opacity = 0.65 - (t - 0.08) * 0.2
    } else {
      opacity = (1 - t) / 0.3 * 0.45
    }

    item.el.style.left = `${item.x}%`
    item.el.style.top = `${y}vh`
    item.el.style.opacity = String(Math.max(0, opacity))
    item.el.style.transform = `translateX(${swayX}px) rotate(${rotate}deg) scale(${item.scale})`
  }

  rafId = requestAnimationFrame(animate)
}

onMounted(async () => {
  try {
    const res = await fetch('/lyrics.json')
    const data: LyricPair[] = await res.json()
    lyrics.value = shuffle(data)
    spawnLyric()
    rafId = requestAnimationFrame(animate)
  } catch (e) {
    // silently fail
  }
})

onUnmounted(() => {
  if (spawnTimer) clearTimeout(spawnTimer)
  if (rafId) cancelAnimationFrame(rafId)
  items.forEach(item => item.el?.remove())
  items.length = 0
})
</script>

<template>
  <div v-if="isHome()" ref="container" class="lyrics-container" aria-hidden="true"></div>
</template>

<style scoped>
.lyrics-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

:deep(.lyric-item) {
  position: absolute;
  white-space: nowrap;
  text-align: center;
  will-change: transform, opacity;
}

:deep(.lyric-ja) {
  font-size: 1.0625rem;
  color: var(--vp-c-brand-1);
  opacity: 0.6;
  letter-spacing: 0.03125rem;
}

:deep(.lyric-zh) {
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
  opacity: 0.4;
  margin-top: 0.1875rem;
}

@media (max-width: 47.9375rem) {
  :deep(.lyric-ja) {
    font-size: 0.875rem;
  }
  :deep(.lyric-zh) {
    font-size: 0.6875rem;
  }
}
</style>
