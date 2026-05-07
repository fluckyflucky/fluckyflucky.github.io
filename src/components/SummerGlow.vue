<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

onMounted(() => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.value!.width = window.innerWidth
    canvas.value!.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const start = performance.now()

  function draw(now: number) {
    if (!ctx || !canvas.value) return
    const t = (now - start) / 1000
    const w = canvas.value.width
    const h = canvas.value.height

    const cycle = t * 0.025
    const s1 = Math.sin(cycle) * 0.5 + 0.5
    const s2 = Math.sin(cycle + 1.5) * 0.5 + 0.5
    const s3 = Math.sin(cycle + 3.0) * 0.5 + 0.5

    const grad = ctx.createLinearGradient(
      w * (0.3 + s1 * 0.2), 0,
      w * (0.5 + s2 * 0.2), h
    )

    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) {
      grad.addColorStop(0, `rgba(10, 25, 50, ${0.3 + s1 * 0.1})`)
      grad.addColorStop(0.4, `rgba(15, 50, 70, ${0.2 + s2 * 0.1})`)
      grad.addColorStop(0.7, `rgba(20, 65, 90, ${0.15 + s3 * 0.08})`)
      grad.addColorStop(1, `rgba(8, 20, 45, ${0.25 + s1 * 0.08})`)
    } else {
      grad.addColorStop(0, `rgba(200, 235, 255, ${0.08 + s1 * 0.05})`)
      grad.addColorStop(0.4, `rgba(150, 220, 240, ${0.06 + s2 * 0.04})`)
      grad.addColorStop(0.7, `rgba(180, 240, 250, ${0.07 + s3 * 0.04})`)
      grad.addColorStop(1, `rgba(210, 245, 255, ${0.06 + s1 * 0.03})`)
    }

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    rafId = requestAnimationFrame(draw)
  }

  rafId = requestAnimationFrame(draw)

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    if (rafId) cancelAnimationFrame(rafId)
  })
})
</script>

<template>
  <canvas ref="canvas" class="summer-glow" aria-hidden="true" />
</template>

<style scoped>
.summer-glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
</style>
