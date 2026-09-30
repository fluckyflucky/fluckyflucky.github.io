<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { getLevels, type DragonVariant } from './assets'
import { DANGER, HEIGHT, MergeWorld, RADII, validSave, WIDTH } from './physics'
import { readBest, readSaved, saveLocal } from '../shared/storage'
import '../shared/game-ui.css'

const props = defineProps<{ variant: DragonVariant }>()
const levels = getLevels(props.variant)
const title = props.variant === 'frog' ? '合成大奶龙（正版）' : '合成大奶龙（盗版）'
const name = props.variant === 'frog' ? '奶蛙' : '奶龙'
const saveKey = `aoinatsu:merge-${props.variant}:session:v1`, bestKey = `aoinatsu:merge-${props.variant}:best:v1`
const saved = readSaved(saveKey)
let world = new MergeWorld(validSave(saved) ? saved : undefined)
const best = ref(Math.max(readBest(bestKey), world.score))
const canvas = ref<HTMLCanvasElement | null>(null)
const loading = ref(true), loadFailed = ref(false), paused = ref(false)
const aim = ref(WIDTH / 2)
function currentState() {
  return { score: world.score, current: world.current, next: world.next, ready: world.ready, over: world.over, won: world.won, maxLevel: world.maxLevel }
}
const state = ref(currentState())
const launchX = computed(() => Math.max(RADII[state.value.current] + 2, Math.min(WIDTH - RADII[state.value.current] - 2, aim.value)))
let images: HTMLImageElement[] = [], observer: ResizeObserver | null = null, frame = 0
let lastTime = 0, accumulator = 0, saveElapsed = 0, disposed = false
let reducedMotion = false

function persist() { saveLocal(saveKey, world.snapshot()); saveLocal(bestKey, best.value) }
function syncState() {
  const value = currentState()
  if (Object.keys(value).some(key => value[key as keyof typeof value] !== state.value[key as keyof typeof value])) state.value = value
  if (world.score > best.value) { best.value = world.score; saveLocal(bestKey, best.value) }
}

async function loadImages() {
  loading.value = true; loadFailed.value = false
  try {
    const loaded = await Promise.all(levels.map(level => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = level.image
    })))
    if (disposed) return
    images = loaded; loading.value = false
    draw()
    scheduleFrame()
  } catch { if (!disposed) { loading.value = false; loadFailed.value = true } }
}

function resizeCanvas() {
  if (!canvas.value) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.value.width = Math.round(canvas.value.clientWidth * dpr)
  canvas.value.height = Math.round(canvas.value.clientWidth * HEIGHT / WIDTH * dpr)
  draw()
}

function drawPiece(ctx: CanvasRenderingContext2D, level: number, x: number, y: number, radius: number, angle = 0, ghost = false) {
  ctx.save()
  ctx.translate(x, y); ctx.rotate(angle)
  ctx.globalAlpha = ghost ? 0.8 : 1
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fillStyle = levels[level].color; ctx.fill()
  ctx.save(); ctx.clip()
  const image = images[level]
  if (image) {
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, -radius, -radius, radius * 2, radius * 2)
  }
  ctx.restore()
  ctx.strokeStyle = '#dcaa52'; ctx.lineWidth = ghost ? 1.5 : 2
  ctx.stroke()
  ctx.restore()
}

function draw() {
  const element = canvas.value, ctx = element?.getContext('2d')
  if (!element || !ctx) return
  ctx.setTransform(element.width / WIDTH, 0, 0, element.height / HEIGHT, 0, 0)
  ctx.fillStyle = '#fff6df'; ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.strokeStyle = '#efe3c6'; ctx.lineWidth = 1
  for (let y = 110; y < HEIGHT; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke() }
  ctx.setLineDash([5, 5]); ctx.strokeStyle = world.danger > 0 ? '#dc6654' : '#cdab80'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(8, DANGER); ctx.lineTo(WIDTH - 8, DANGER); ctx.stroke(); ctx.setLineDash([])
  ctx.fillStyle = '#a7815e'; ctx.font = '11px sans-serif'; ctx.fillText('危险线', 12, DANGER - 8)
  if (!world.over && !world.won) {
    const x = launchX.value
    ctx.setLineDash([3, 6]); ctx.strokeStyle = '#ddc995'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, DANGER + 12); ctx.lineTo(x, HEIGHT - 8); ctx.stroke(); ctx.setLineDash([])
    drawPiece(ctx, world.current, x, 32, RADII[world.current], 0, true)
  }
  for (const { body, level } of world.pieces.values()) {
    drawPiece(ctx, level, body.position.x, body.position.y, RADII[level], body.angle)
  }
  if (!reducedMotion) for (const effect of world.effects) {
    const progress = effect.age / 380
    ctx.globalAlpha = 1 - progress; ctx.strokeStyle = '#edb340'; ctx.lineWidth = 3 * (1 - progress)
    ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (1 + progress * 0.4), 0, Math.PI * 2); ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function loop(time: number) {
  frame = 0
  if (disposed || document.hidden) { lastTime = 0; return }
  const delta = lastTime ? Math.min(time - lastTime, 50) : 0
  lastTime = time
  if (!paused.value && !loading.value && !loadFailed.value) {
    accumulator += delta
    while (accumulator >= 1000 / 60) { world.step(); accumulator -= 1000 / 60 }
    saveElapsed += delta
    if (saveElapsed > 1200) { persist(); saveElapsed = 0 }
  }
  syncState(); draw()
  if (world.over || world.won) { persist(); lastTime = 0 }
  else if (!paused.value) scheduleFrame()
}
function scheduleFrame() { if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(loop) }
function onVisibility() {
  lastTime = 0; accumulator = 0
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; persist() } else scheduleFrame()
}

function drop() {
  if (loading.value || loadFailed.value || paused.value) return
  if (world.drop(launchX.value)) { syncState(); persist(); canvas.value?.focus({ preventScroll: true }) }
}
function restart() {
  world.destroy(); world = new MergeWorld(); paused.value = false
  accumulator = 0; lastTime = 0; syncState(); persist(); draw()
  scheduleFrame()
  nextTick(() => canvas.value?.focus({ preventScroll: true }))
}
function continuePlaying() { world.keepPlaying = true; syncState(); persist(); scheduleFrame(); canvas.value?.focus({ preventScroll: true }) }
function togglePause() {
  paused.value = !paused.value; lastTime = 0; accumulator = 0
  if (paused.value) { cancelAnimationFrame(frame); frame = 0; persist() }
  else scheduleFrame()
}
function aimAt(event: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()
  if (rect) aim.value = (event.clientX - rect.left) / rect.width * WIDTH
}
let pointer: number | null = null
function pointerDown(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return
  pointer = event.pointerId; aimAt(event)
  canvas.value?.setPointerCapture(event.pointerId)
  canvas.value?.focus({ preventScroll: true })
}
function pointerMove(event: PointerEvent) { if (pointer === event.pointerId || event.pointerType === 'mouse') aimAt(event) }
function pointerUp(event: PointerEvent) {
  if (pointer !== event.pointerId) return
  pointer = null; aimAt(event); drop()
}
function onKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (['ArrowLeft', 'ArrowRight', 'ArrowDown', ' ', 'Enter'].includes(event.key)) {
    event.preventDefault()
    if (event.key === 'ArrowLeft') aim.value = Math.max(0, aim.value - 16)
    else if (event.key === 'ArrowRight') aim.value = Math.min(WIDTH, aim.value + 16)
    else drop()
  }
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  observer = new ResizeObserver(resizeCanvas)
  if (canvas.value) observer.observe(canvas.value)
  resizeCanvas(); void loadImages()
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  disposed = true; persist(); cancelAnimationFrame(frame); observer?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
  world.destroy()
})
</script>

<template>
  <div class="arcade dragon-game">
    <header class="arcade-header">
      <div><h1 class="arcade-title">合成大奶龙<span class="version-label">{{ variant === 'frog' ? '正版' : '盗版' }}</span></h1></div>
      <div class="arcade-stats">
        <div class="arcade-score"><span>得分</span><strong>{{ state.score }}</strong></div>
        <div class="arcade-score"><span>最高分</span><strong>{{ best }}</strong></div>
      </div>
    </header>
    <div class="arcade-layout">
      <section class="arcade-player">
        <div class="arcade-toolbar">
          <div class="next-piece"><span>下一个</span><img :src="levels[state.next].image" :alt="levels[state.next].name" /></div>
          <div class="arcade-actions">
            <button class="arcade-button" :disabled="loading || state.over || state.won" @click="togglePause">{{ paused ? '继续' : '暂停' }}</button>
            <button class="arcade-button primary" @click="restart">新一局</button>
          </div>
        </div>
        <div class="drop-field">
          <canvas ref="canvas" :width="WIDTH" :height="HEIGHT" class="drop-canvas" tabindex="0" role="group" :aria-label="`${title}游戏区`" aria-describedby="merge-instructions" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointer = null" @keydown="onKey" />
          <div v-if="loading || loadFailed" class="arcade-result">
            <p>{{ loadFailed ? '图片没加载出来' : '加载图片…' }}</p>
            <button v-if="loadFailed" class="arcade-button primary" @click="loadImages">重试</button>
          </div>
          <div v-else-if="state.over || state.won || paused" class="arcade-result">
            <h2>{{ state.won ? `合出大${name}了！` : state.over ? '堆满了' : '已暂停' }}</h2>
            <p v-if="!paused">得分 {{ state.score }}</p>
            <div class="arcade-actions">
              <button v-if="state.won" class="arcade-button primary" @click="continuePlaying">继续玩</button>
              <button v-else-if="paused" class="arcade-button primary" @click="togglePause">继续</button>
              <button v-if="!paused" class="arcade-button" :class="{ primary: state.over }" @click="restart">再来一局</button>
            </div>
          </div>
        </div>
        <div class="drop-controls">
          <input v-model.number="aim" type="range" :min="RADII[state.current] + 2" :max="WIDTH - RADII[state.current] - 2" aria-label="投放位置" :disabled="paused || loading || state.over || state.won" />
          <button class="arcade-button primary" :disabled="!state.ready || paused || loading || loadFailed" @click="drop">丢下去</button>
        </div>
        <p class="arcade-status" role="status" aria-live="polite">{{ loading ? '加载中' : paused ? '已暂停' : '点击投放，拖动后松手也可以。' }}</p>
        <p class="sr-only" role="status" aria-live="polite">得分 {{ state.score }}。{{ state.won ? `合出大${name}了` : state.over ? '游戏结束' : '' }}</p>
      </section>
      <aside class="arcade-notes">
        <div class="arcade-note">
          <h2>怎么玩</h2>
          <p id="merge-instructions">选择位置，把{{ name }}丢下去。相同的碰到一起，就合成更大的一只。</p>
          <p>堆过虚线太久就会结束。电脑也可以用左右键调整，空格投放。</p>
          <h2 class="progression-title">合成顺序</h2>
          <div class="progression">
            <div v-for="(level, index) in levels" :key="index" class="progression-piece" :class="{ reached: index <= state.maxLevel }">
              <img :src="level.image" :alt="level.name" :title="level.name" /><span>{{ index + 1 }}</span>
            </div>
          </div>
        </div>
        <p class="arcade-save-note">进度和最高分自动保存在这个浏览器。</p>
        <RouterLink :to="variant === 'frog' ? '/games/merge-dragon' : '/games/merge-frog'" class="variant-link">{{ variant === 'frog' ? '玩奶龙版 →' : '玩奶蛙版 →' }}</RouterLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.version-label { display: inline-block; vertical-align: middle; margin-left: 8px; padding: 3px 8px; font-size: 11px; font-weight: 400; color: #f4d291; border: 1px solid rgb(244 210 145 / 0.2); border-radius: 6px; }
.next-piece { display: flex; align-items: center; gap: 9px; color: #a8a29e; font-size: 12px; }
.next-piece img { width: 32px; height: 32px; object-fit: cover; border-radius: 50%; border: 1px solid #d3ae6b; }
.drop-field { position: relative; overflow: hidden; border-radius: 17px; border: 2px solid #b89253; background: #fff6df; }
.drop-canvas { width: 100%; aspect-ratio: 360 / 480; display: block; cursor: crosshair; touch-action: pinch-zoom; user-select: none; }
.drop-canvas:focus-visible { outline: 3px solid #22d3ee; outline-offset: -4px; }
.drop-controls { display: flex; align-items: center; gap: 14px; margin-top: 15px; }
.drop-controls input { min-width: 0; flex: 1; accent-color: #d3ae6b; min-height: 44px; cursor: pointer; }
.drop-controls .arcade-button { min-width: 88px; min-height: 44px; }
.arcade-note h2.progression-title { margin-top: 20px; }
.progression { display: flex; flex-wrap: wrap; gap: 8px; }
.progression-piece { display: flex; flex-direction: column; align-items: center; gap: 3px; opacity: 0.45; }
.progression-piece.reached { opacity: 1; }
.progression-piece img { width: 40px; height: 40px; object-fit: cover; border-radius: 50%; border: 1px solid rgb(211 174 107 / 0.6); }
.progression-piece span { font-size: 10px; color: #a8a29e; }
.variant-link { display: inline-block; margin: 12px 4px 0; padding: 6px 0; color: #67e8f9; font-size: 12px; }
.variant-link:focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }
@media (max-width: 767px) { .arcade-header { flex-wrap: nowrap; gap: 12px; } .arcade-title { font-size: 26px; white-space: nowrap; } }
@media (max-width: 380px) { .arcade-header { gap: 8px; } .arcade-title { font-size: 22px; } .version-label { margin-left: 5px; padding: 2px 4px; font-size: 10px; } .arcade-score { min-width: 58px; padding: 8px; } .arcade-score strong { font-size: 20px; } }
</style>
