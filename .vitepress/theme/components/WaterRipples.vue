<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  opacity: number
  rings: number // 1=small trail, 2=auto, 3=click/tap splash
  birth: number // timestamp for phase animation
  wobble: number // per-ripple random offset for organic feel
}

interface TrailDot {
  x: number
  y: number
  opacity: number
  size: number
}

const canvas = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null
let spawnTimer: number | null = null

onMounted(() => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  const isMobile = 'ontouchstart' in window || window.innerWidth < 768
  const SCALE = isMobile ? 6 : 4
  const MAX_RIPPLES = isMobile ? 12 : 30
  const MAX_TRAIL = isMobile ? 30 : 80

  const offscreen = document.createElement('canvas')
  const offCtx = offscreen.getContext('2d')!

  const ripples: Ripple[] = []
  const trail: TrailDot[] = []
  let mouseX = -1
  let mouseY = -1
  let lastTrailSpawn = 0

  const resize = () => {
    canvas.value!.width = window.innerWidth
    canvas.value!.height = window.innerHeight
    offscreen.width = Math.ceil(window.innerWidth / SCALE)
    offscreen.height = Math.ceil(window.innerHeight / SCALE)
  }
  resize()
  window.addEventListener('resize', resize)

  // --- pointer interaction (mouse + touch) ---
  function addTrailAndRipple(x: number, y: number) {
    mouseX = x
    mouseY = y

    const now = performance.now()
    if (now - lastTrailSpawn > 16) {
      if (trail.length < MAX_TRAIL) {
        trail.push({
          x, y,
          opacity: 0.4,
          size: 2 + Math.random() * 2,
        })
      }
      lastTrailSpawn = now
    }

    if (Math.random() < 0.45 && ripples.length < MAX_RIPPLES) {
      ripples.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        radius: 0,
        maxRadius: 40 + Math.random() * 50,
        opacity: 0.25 + Math.random() * 0.1,
        rings: 1,
        birth: performance.now(),
        wobble: Math.random() * Math.PI * 2,
      })
    }
  }

  function addSplash(x: number, y: number) {
    const now = performance.now()
    if (ripples.length < MAX_RIPPLES) {
      ripples.push({
        x, y, radius: 0,
        maxRadius: isMobile ? 80 + Math.random() * 40 : 100 + Math.random() * 60,
        opacity: 0.45,
        rings: 3,
        birth: now,
        wobble: Math.random() * Math.PI * 2,
      })
    }
    const count = isMobile ? 2 : 3
    for (let i = 0; i < count; i++) {
      if (ripples.length >= MAX_RIPPLES) break
      const angle = Math.random() * Math.PI * 2
      const dist = 15 + Math.random() * 20
      ripples.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        radius: 0,
        maxRadius: 30 + Math.random() * 30,
        opacity: 0.2 + Math.random() * 0.1,
        rings: 2,
        birth: now,
        wobble: Math.random() * Math.PI * 2,
      })
    }
  }

  // mouse events
  function onMouseMove(e: MouseEvent) {
    addTrailAndRipple(e.clientX, e.clientY)
  }
  function onMouseClick(e: MouseEvent) {
    addSplash(e.clientX, e.clientY)
  }

  // touch events
  function onTouchMove(e: TouchEvent) {
    const t = e.touches[0]
    if (t) addTrailAndRipple(t.clientX, t.clientY)
  }
  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0]
    if (t) {
      mouseX = t.clientX
      mouseY = t.clientY
      addSplash(t.clientX, t.clientY)
    }
  }
  function onTouchEnd() {
    // fade out mouse position so caustics don't stick
    mouseX = -1
    mouseY = -1
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('click', onMouseClick)
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend', onTouchEnd)

  // --- auto ripples ---
  function spawnAuto() {
    if (ripples.length >= MAX_RIPPLES) return
    const w = canvas.value!.width
    const h = canvas.value!.height
    ripples.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 0,
      maxRadius: isMobile ? 50 + Math.random() * 60 : 60 + Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.15,
      rings: 2,
      birth: performance.now(),
      wobble: Math.random() * Math.PI * 2,
    })
  }

  function scheduleSpawn() {
    const interval = isMobile ? 1000 + Math.random() * 1500 : 700 + Math.random() * 1200
    spawnTimer = window.setTimeout(() => {
      spawnAuto()
      scheduleSpawn()
    }, interval)
  }
  const initCount = isMobile ? 2 : 3
  for (let i = 0; i < initCount; i++) spawnAuto()
  scheduleSpawn()

  const start = performance.now()

  function drawCaustics(t: number) {
    const ow = offscreen.width
    const oh = offscreen.height
    const imageData = offCtx.createImageData(ow, oh)
    const data = imageData.data
    const isDark = document.documentElement.classList.contains('dark')

    const speed = t * 0.4
    // light mode: lower frequency → larger, more relaxed caustic patterns
    const fq = isDark ? 1 : 0.55
    for (let y = 0; y < oh; y++) {
      for (let x = 0; x < ow; x++) {
        const px = x * SCALE
        const py = y * SCALE

        const v1 = Math.sin(px * 0.015 * fq + speed * 0.7)
              + Math.sin(py * 0.012 * fq + speed * 0.5)
        const v2 = Math.sin((px * 0.8 + py * 0.6) * 0.01 * fq + speed * 0.6)
              + Math.sin((px * 0.6 - py * 0.8) * 0.013 * fq - speed * 0.4)
        const v3 = Math.sin(
          Math.sqrt(px * px * 0.00004 * fq * fq + py * py * 0.00004 * fq * fq) * 3
          + speed * 0.3
        )

        const raw = (v1 + v2 + v3) / 6 + 0.5
        const bright = Math.pow(Math.max(0, raw), 2.5)

        const idx = (y * ow + x) * 4
        if (isDark) {
          data[idx]     = 20 + bright * 40
          data[idx + 1] = 140 + bright * 70
          data[idx + 2] = 180 + bright * 50
          data[idx + 3] = Math.min(255, bright * 38)
        } else {
          data[idx]     = 74 + bright * 80
          data[idx + 1] = 200 + bright * 40
          data[idx + 2] = 222 + bright * 30
          data[idx + 3] = Math.min(255, bright * 30)
        }
      }
    }
    offCtx.putImageData(imageData, 0, 0)
  }

  function drawRipple(r: Ripple, isDark: boolean, now: number) {
    const progress = r.radius / r.maxRadius
    const baseAlpha = r.opacity * (1 - progress)
    if (baseAlpha <= 0.003) return false

    const baseColor = isDark ? '30, 185, 209' : '74, 200, 222'
    const glowColor = isDark ? '120, 220, 240' : '180, 240, 255'

    // Determine wave count based on ripple type and current radius
    // More rings appear as the ripple expands — like real water
    const waveSpacing = r.rings === 1 ? 10 : r.rings === 3 ? 14 : 16
    const waveCount = Math.min(
      r.rings === 1 ? 5 : r.rings === 3 ? 8 : 5,
      Math.floor(r.radius / waveSpacing) + 1
    )

    // Animate a subtle phase shift for liveliness
    const age = (now - r.birth) / 1000
    const phase = age * 1.2 + r.wobble

    for (let i = 0; i < waveCount; i++) {
      // Each wave ring sits at a fraction of the current radius
      const waveFrac = 1 - (i * waveSpacing) / r.radius
      if (waveFrac <= 0.05) break
      const waveRadius = r.radius * waveFrac

      // Sine modulation: outer rings are stronger, inner rings fade
      const envelope = Math.pow(waveFrac, 0.6) * (1 - waveFrac * 0.3)
      // Subtle breathing via sine
      const breath = 1 + Math.sin(phase + i * 0.8) * 0.08
      const alpha = baseAlpha * envelope * breath * (i === 0 ? 1 : 0.7)

      if (alpha < 0.005) continue

      // Line width: outermost ring is thickest, inner rings thinner
      const lw = (r.rings >= 3 ? 1.8 : 1.2) * (1 - progress * 0.4) * (i === 0 ? 1 : 0.6 + 0.4 * waveFrac)

      ctx.beginPath()
      ctx.arc(r.x, r.y, waveRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${baseColor}, ${alpha})`
      ctx.lineWidth = lw
      ctx.stroke()
    }

    // Center glow at birth
    if (progress < 0.12) {
      const dotAlpha = baseAlpha * (1 - progress / 0.12) * 0.6
      const s = r.rings >= 3 ? 7 : 4
      const grad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, s)
      grad.addColorStop(0, `rgba(${glowColor}, ${dotAlpha})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(r.x - s, r.y - s, s * 2, s * 2)
    }

    // Expansion speed: decelerates naturally
    const speed = r.rings === 1 ? 0.7 : r.rings === 3 ? 0.65 : 0.45
    r.radius += speed + (1 - progress) * 0.5
    return true
  }

  function drawTrail(isDark: boolean) {
    const baseColor = isDark ? '80, 200, 230' : '120, 220, 245'
    for (let i = trail.length - 1; i >= 0; i--) {
      const dot = trail[i]
      if (dot.opacity <= 0.005) {
        trail.splice(i, 1)
        continue
      }
      const grad = ctx.createRadialGradient(
        dot.x, dot.y, 0, dot.x, dot.y, dot.size * 3
      )
      grad.addColorStop(0, `rgba(${baseColor}, ${dot.opacity * 0.6})`)
      grad.addColorStop(0.5, `rgba(${baseColor}, ${dot.opacity * 0.2})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      const r = dot.size * 3
      ctx.fillRect(dot.x - r, dot.y - r, r * 2, r * 2)
      dot.opacity *= 0.96
      dot.size *= 0.998
    }
  }

  function draw(now: number) {
    if (!ctx || !canvas.value) return
    const t = (now - start) / 1000
    const w = canvas.value.width
    const h = canvas.value.height
    const isDark = document.documentElement.classList.contains('dark')

    ctx.clearRect(0, 0, w, h)

    drawCaustics(t)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(offscreen, 0, 0, w, h)

    drawTrail(isDark)

    for (let i = ripples.length - 1; i >= 0; i--) {
      if (!drawRipple(ripples[i], isDark, now)) {
        ripples.splice(i, 1)
      }
    }

    rafId = requestAnimationFrame(draw)
  }

  rafId = requestAnimationFrame(draw)

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('click', onMouseClick)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
    if (rafId) cancelAnimationFrame(rafId)
    if (spawnTimer) clearTimeout(spawnTimer)
  })
})
</script>

<template>
  <canvas
    ref="canvas"
    class="water-ripples"
    aria-hidden="true"
  />
</template>

<style scoped>
.water-ripples {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
