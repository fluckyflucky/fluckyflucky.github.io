<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

interface LyricPair {
  ja: string
  zh: string
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
  driftDir: number
  driftSpeed: number
  phase1: number
  phase2: number
  phase3: number
  phase4: number
}

const route = useRoute()
const container = ref<HTMLElement | null>(null)
const lyrics = ref<LyricPair[]>([])
const items: FallingItem[] = []
let spawnTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null
let nextId = 0
let idx = 0

const isHome = () => route.path === '/'
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
    duration: (10 + Math.random() * 5) * 1000,
    x: mobile ? 30 + Math.random() * 40 : 20 + Math.random() * 60,
    scale,
    swayAmp: mobile ? 20 + Math.random() * 30 : 35 + Math.random() * 55,
    driftDir: Math.random() > 0.5 ? 1 : -1,
    driftSpeed: 0.3 + Math.random() * 0.7,
    phase1: Math.random() * Math.PI * 2,
    phase2: Math.random() * Math.PI * 2,
    phase3: Math.random() * Math.PI * 2,
    phase4: Math.random() * Math.PI * 2,
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
    const t = Math.min(elapsed / item.duration, 1)

    if (t >= 1) {
      item.el.remove()
      items.splice(i, 1)
      continue
    }

    // Y: exponential acceleration (e^(kt)-1) — starts slow, speeds up like gravity
    const y = (Math.exp(3.5 * t) - 1) / (Math.exp(3.5) - 1) * 90

    // X: directional drift + multi-frequency sway with logarithmic amplitude decay
    const drift = item.driftDir * item.driftSpeed * item.swayAmp * Math.pow(t, 1.3)
    const decay = Math.log(1 + 4 * (1 - t)) / Math.log(5)
    const sway1 = Math.sin(t * Math.PI * 2 * 0.7 + item.phase1) * item.swayAmp * decay
    const sway2 = Math.sin(t * Math.PI * 2 * 2.1 + item.phase2) * item.swayAmp * 0.4 * decay
    const swayX = drift + sway1 + sway2

    // Rotation: multi-frequency wobble
    const rot1 = Math.sin(t * Math.PI * 2 * 0.7 + item.phase3) * 15
    const rot2 = Math.cos(t * Math.PI * 2 * 2.1 + item.phase4) * 7
    const rotate = rot1 + rot2

    let opacity: number
    if (t < 0.1) {
      opacity = t / 0.1 * 0.65
    } else if (t < 0.6) {
      opacity = 0.65 - (t - 0.1) * 0.15
    } else {
      opacity = (1 - t) / 0.4 * 0.5
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
    const grouped: Record<string, [string, string][]> = await res.json()
    // Flatten all songs into one pool
    const pool: LyricPair[] = []
    for (const pairs of Object.values(grouped)) {
      for (const [ja, zh] of pairs) {
        pool.push({ ja, zh })
      }
    }
    lyrics.value = shuffle(pool)
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

<style>
.lyrics-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.lyric-item {
  position: absolute;
  white-space: nowrap;
  text-align: center;
  will-change: transform, opacity;
}

.lyric-ja {
  font-size: 1.0625rem;
  color: #7dd3fc;
  opacity: 0.6;
  letter-spacing: 0.03125rem;
}

.lyric-zh {
  font-size: 0.8125rem;
  color: #a8a29e;
  opacity: 0.4;
  margin-top: 0.1875rem;
}

@media (max-aspect-ratio: 13/9) {
  .lyric-ja {
    font-size: 0.875rem;
  }
  .lyric-zh {
    font-size: 0.6875rem;
  }
}
</style>
