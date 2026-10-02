<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, triggerRef, useId } from 'vue'
import { COLS, ROWS, HIDDEN, cells, fresh, hardDrop, hold, landing, level, move, rotate, softDrop, tick, validSave, type Kind } from './logic'
import { sideEye, smiling } from '../frogArt/art'
import { readBest, readSaved, saveLocal } from '../shared/storage'
import GameIcon from '../shared/GameIcon.vue'
import PiecePreview from './PiecePreview.vue'
import '../shared/game-ui.css'

type Action = 'left' | 'right' | 'down' | 'cw' | 'ccw' | 'drop' | 'hold'
const saveKey = 'aoinatsu:frog-blocks:session:v1', bestKey = 'aoinatsu:frog-blocks:best:v1'
const data = readSaved(saveKey)
const game = shallowRef(validSave(data) ? data : fresh())
const paused = ref(true), started = ref(validSave(data)), confirmReset = ref(false)
const best = ref(Math.max(readBest(bestKey), game.value.score)), root = ref<HTMLElement | null>(null), boardElement = ref<HTMLElement | null>(null)
const clipId = `frog-blocks-${useId().replaceAll(':', '')}`
const activeCells = computed(() => game.value.over ? [] : cells(game.value.active).filter(p => p.y >= HIDDEN).map(p => ({ x: p.x, y: p.y - HIDDEN })))
const placedCells = computed(() => game.value.board.flatMap((kind, index) => kind && index >= HIDDEN * COLS ? [{ x: index % COLS, y: Math.floor(index / COLS) - HIDDEN, kind }] : []))
const ghostCells = computed(() => game.value.over ? [] : cells(landing(game.value)).filter(p => p.y >= HIDDEN).map(p => ({ x: p.x, y: p.y - HIDDEN })))
const running = computed(() => !paused.value && !game.value.over && !confirmReset.value)
const outlines: Record<Kind, string> = { I: '#075985', J: '#1e40af', L: '#9a3412', O: '#854d0e', S: '#166534', T: '#6b21a8', Z: '#991b1b' }
const pressed = new Map<string, { action: Action; age: number; next: number }>()
let frame = 0, previousTime = 0, savedAt = 0
let gesture: { id: number; x: number; y: number; lastX: number; moved: boolean } | null = null

function persist() { saveLocal(saveKey, game.value); saveLocal(bestKey, best.value) }
function render() {
  triggerRef(game)
  best.value = Math.max(best.value, game.value.score)
  if (game.value.over) { pressed.clear(); persist() }
}
function perform(action: Action) {
  if (!running.value) return
  const s = game.value
  if (action === 'left') move(s, -1)
  else if (action === 'right') move(s, 1)
  else if (action === 'down') softDrop(s)
  else if (action === 'cw') rotate(s, 1)
  else if (action === 'ccw') rotate(s, -1)
  else if (action === 'drop') hardDrop(s)
  else hold(s)
  render(); persist()
}
function focusBoard() { nextTick(() => boardElement.value?.focus({ preventScroll: true })) }
function play() { paused.value = false; started.value = true; previousTime = 0; focusBoard() }
function pause() { paused.value = true; pressed.clear(); gesture = null; persist() }
function restart() {
  game.value = fresh(); pressed.clear(); gesture = null; confirmReset.value = false
  paused.value = true; started.value = false; previousTime = 0; persist(); focusBoard()
}
function requestRestart() {
  if (!started.value || game.value.over) restart()
  else { pause(); confirmReset.value = true }
}
function pointerStart(event: PointerEvent, action: Action) {
  if (event.button !== 0 || !running.value) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  pressed.set(`pointer-${event.pointerId}`, { action, age: 0, next: 140 })
  perform(action)
}
function pointerStop(event: PointerEvent) { pressed.delete(`pointer-${event.pointerId}`) }
function gestureStart(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0 || !running.value) return
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, moved: false }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  boardElement.value?.focus({ preventScroll: true })
}
function gestureMove(event: PointerEvent) {
  if (!gesture || gesture.id !== event.pointerId || !running.value) return
  if (Math.abs(event.clientY - gesture.y) > Math.abs(event.clientX - gesture.x) && !gesture.moved) return
  const cell = boardElement.value!.clientWidth / COLS
  while (Math.abs(event.clientX - gesture.lastX) >= cell) {
    const direction = event.clientX > gesture.lastX ? 1 : -1
    gesture.lastX += direction * cell; gesture.moved = true
    perform(direction > 0 ? 'right' : 'left')
  }
}
function gestureEnd(event: PointerEvent) {
  if (!gesture || gesture.id !== event.pointerId) return
  const { x, y, moved } = gesture
  gesture = null
  if (!running.value) return
  const dx = event.clientX - x, dy = event.clientY - y
  if (!moved && Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) perform(dy > 0 ? 'drop' : 'hold')
  else if (!moved && Math.max(Math.abs(dx), Math.abs(dy)) < 15) perform('cw')
}
const keys: Record<string, Action> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down',
  ArrowUp: 'cw', KeyW: 'cw', KeyX: 'cw', KeyZ: 'ccw', Space: 'drop', KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold',
}
function keyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement).matches('input, select, textarea')) return
  if ((event.code === 'Space' || event.code === 'Enter') && (event.target as HTMLElement).closest('button, summary')) return
  if (event.code === 'KeyP' || event.code === 'Escape') {
    event.preventDefault()
    if (event.repeat || game.value.over || confirmReset.value) return
    if (paused.value) play(); else pause()
    return
  }
  const action = keys[event.code]
  if (!action || !running.value) return
  event.preventDefault()
  if (event.repeat || pressed.has(event.code)) return
  if (action === 'left' || action === 'right' || action === 'down') pressed.set(event.code, { action, age: 0, next: 140 })
  perform(action)
}
function keyUp(event: KeyboardEvent) { pressed.delete(event.code) }
function focusOut(event: FocusEvent) {
  if (event.relatedTarget && !root.value?.contains(event.relatedTarget as Node)) pause()
}
function animate(time: number) {
  const delta = previousTime ? Math.min(50, time - previousTime) : 0
  previousTime = time
  if (running.value && !document.hidden) {
    for (const control of pressed.values()) {
      control.age += delta
      if (control.action === 'down') continue
      while (control.age >= control.next) { perform(control.action); control.next += 40 }
    }
    if (tick(game.value, delta, [...pressed.values()].some(p => p.action === 'down'))) render()
    if (time - savedAt >= 1000) { persist(); savedAt = time }
  }
  frame = requestAnimationFrame(animate)
}
function visibility() { if (document.hidden) pause() }
function blur() { if (running.value) pause(); else pressed.clear() }
onMounted(() => {
  frame = requestAnimationFrame(animate)
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('blur', blur)
  window.addEventListener('keyup', keyUp)
  persist()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame); pressed.clear(); persist()
  document.removeEventListener('visibilitychange', visibility)
  window.removeEventListener('blur', blur)
  window.removeEventListener('keyup', keyUp)
})
</script>

<template>
  <div ref="root" class="arcade frog-blocks" @keydown="keyDown" @focusout="focusOut">
    <header class="arcade-header">
      <h1 class="arcade-title">奶龙似方块</h1>
      <div class="arcade-stats">
        <div class="arcade-score"><span>得分</span><strong>{{ game.score }}</strong></div>
        <div class="arcade-score"><span>最高分</span><strong>{{ best }}</strong></div>
      </div>
    </header>
    <section class="blocks-player">
      <div class="arcade-toolbar">
        <p><span>{{ level(game) }} 级</span><span class="line-count">{{ game.lines }} 行</span></p>
        <div class="arcade-actions">
          <button class="arcade-button icon-button" :aria-label="paused ? (started ? '继续' : '开始') : '暂停'" :title="paused ? (started ? '继续' : '开始') : '暂停'" :disabled="game.over || confirmReset" @click="paused ? play() : pause()"><GameIcon :name="paused ? 'play' : 'pause'" /></button>
          <button class="arcade-button icon-button primary" aria-label="新一局" title="新一局" @click="requestRestart"><GameIcon name="reset" /></button>
          <details class="game-help blocks-help" @toggle="($event.target as HTMLDetailsElement).open && pause()"><summary aria-label="操作" title="操作"><GameIcon name="help" /></summary>
            <div class="arcade-note"><p>← → 移动 · ↓ 加速 · ↑ / X 旋转<br />Z 反转 · 空格落底 · C 暂存<br />P / Esc 暂停</p><p>手机用下方按钮，也可以左右拖动、点按旋转、下滑落底、上滑暂存。</p></div>
          </details>
        </div>
      </div>
      <div class="piece-tray">
        <button class="hold-piece" aria-label="暂存方块" title="暂存 · C" :disabled="!running || game.holdUsed" @click="perform('hold'); focusBoard()"><span>暂存</span><PiecePreview :kind="game.hold" /></button>
        <div class="next-pieces" aria-label="接下来的三个方块"><span>下一块</span><PiecePreview v-for="(kind, i) in game.next.slice(0, 3)" :key="i" :kind="kind" /></div>
      </div>
      <div ref="boardElement" class="blocks-board" tabindex="0" role="group" aria-label="方块棋盘"
        @pointerdown="gestureStart" @pointermove="gestureMove" @pointerup="gestureEnd" @pointercancel="gesture = null">
        <svg class="blocks-scene" viewBox="0 0 200 400" role="img" :aria-label="`方块棋盘，已消除 ${game.lines} 行，得分 ${game.score}`">
          <defs><clipPath :id="clipId"><rect v-for="(p, i) in [...placedCells, ...activeCells]" :key="i" :x="p.x * 20" :y="p.y * 20" width="20" height="20" /></clipPath></defs>
          <svg class="empty-picture" x="0" y="0" width="200" height="400" viewBox="347.5 48 719 1438" preserveAspectRatio="none">
            <image :href="smiling" x="0" y="0" width="1414" height="1514" />
          </svg>
          <g :clip-path="`url(#${clipId})`">
            <svg class="filled-picture" x="0" y="0" width="200" height="400" viewBox="92 160 220 440" preserveAspectRatio="none">
              <image :href="sideEye" x="0" y="0" width="408" height="720" />
            </svg>
          </g>
          <g v-if="running" class="ghost-squares" fill="none" stroke="#075985" stroke-width="1" stroke-dasharray="2 2">
            <rect v-for="(p, i) in ghostCells" :key="i" :x="p.x * 20 + 1.5" :y="p.y * 20 + 1.5" width="17" height="17" />
          </g>
          <g class="placed-squares" fill="none" stroke-width=".8"><rect v-for="p in placedCells" :key="`${p.x},${p.y}`" :x="p.x * 20 + .4" :y="p.y * 20 + .4" width="19.2" height="19.2" :stroke="outlines[p.kind]" /></g>
          <g class="active-squares" fill="none" stroke="#0891b2" stroke-width="1.4"><rect v-for="(p, i) in activeCells" :key="i" :x="p.x * 20 + .7" :y="p.y * 20 + .7" width="18.6" height="18.6" /></g>
        </svg>
        <div v-if="paused || game.over || confirmReset" class="blocks-overlay" :class="{ dim: game.over || confirmReset }">
          <template v-if="confirmReset"><h2>重开这一局？</h2><div class="arcade-actions"><button class="arcade-button" @click="confirmReset = false">取消</button><button class="arcade-button primary" @click="restart">重开</button></div></template>
          <template v-else-if="game.over"><h2>堆满了</h2><p>{{ game.score }} 分</p><button class="arcade-button primary" @click="restart">再来一局</button></template>
          <template v-else><button class="play-button" :aria-label="started ? '继续游戏' : '开始游戏'" :title="started ? '继续游戏' : '开始游戏'" @click="play"><GameIcon name="play" /></button></template>
        </div>
      </div>
      <div class="block-controls" role="group" aria-label="方块操作">
        <button class="arcade-button icon-button" aria-label="向左" title="向左 · ←" :disabled="!running" @pointerdown="pointerStart($event, 'left')" @pointerup="pointerStop" @pointercancel="pointerStop" @lostpointercapture="pointerStop" @click="$event.detail === 0 && perform('left')"><GameIcon name="arrow" class="left-arrow" /></button>
        <button class="arcade-button icon-button" aria-label="加速下落" title="加速下落 · ↓" :disabled="!running" @pointerdown="pointerStart($event, 'down')" @pointerup="pointerStop" @pointercancel="pointerStop" @lostpointercapture="pointerStop" @click="$event.detail === 0 && perform('down')"><GameIcon name="arrow" class="down-arrow" /></button>
        <button class="arcade-button icon-button" aria-label="向右" title="向右 · →" :disabled="!running" @pointerdown="pointerStart($event, 'right')" @pointerup="pointerStop" @pointercancel="pointerStop" @lostpointercapture="pointerStop" @click="$event.detail === 0 && perform('right')"><GameIcon name="arrow" class="right-arrow" /></button>
        <button class="arcade-button icon-button" aria-label="逆时针旋转" title="逆时针 · Z" :disabled="!running" @click="perform('ccw')"><GameIcon name="reset" /></button>
        <button class="arcade-button icon-button" aria-label="顺时针旋转" title="顺时针 · ↑" :disabled="!running" @click="perform('cw')"><GameIcon name="reset" class="clockwise" /></button>
        <button class="arcade-button icon-button primary" aria-label="落到底部" title="落底 · 空格" :disabled="!running" @click="perform('drop')"><GameIcon name="drop" /></button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.blocks-player { width: 100%; max-width: 340px; margin: 0 auto; }
.line-count { margin-left: 16px; }
.piece-tray { display: flex; align-items: stretch; gap: 8px; margin-bottom: 8px; }
.hold-piece, .next-pieces { display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #3d4b49; border-radius: 9px; padding: 4px 8px; min-height: 48px; background: #162629; color: #d6d3d1; }
.hold-piece { cursor: pointer; }
.hold-piece:disabled { opacity: .45; cursor: default; }
.hold-piece:focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }
.piece-tray span { font-size: 11px; flex-shrink: 0; }
.piece-tray svg { width: 44px; height: 36px; }
.next-pieces { flex: 1; min-width: 0; gap: 2px; }
.next-pieces svg { min-width: 0; }
.blocks-board { position: relative; margin: 0 auto; width: min(100%, calc(50svh - 190px)); min-width: 180px; max-width: 300px; aspect-ratio: 1 / 2; border: 2px solid #75806c; border-radius: 8px; background: #fff; overflow: hidden; touch-action: none; user-select: none; }
.blocks-board:focus-visible { outline: 2px solid #22d3ee; outline-offset: 4px; }
.blocks-scene { display: block; width: 100%; height: 100%; pointer-events: none; }
.blocks-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 12px; }
.blocks-overlay.dim { background: rgb(12 23 30 / .92); }
.blocks-overlay h2 { font-size: 22px; font-weight: 700; color: #f5f5f4; }
.blocks-overlay p { color: #d6d3d1; }
.play-button { display: grid; place-items: center; width: 64px; height: 64px; border: 2px solid #164e63; border-radius: 50%; color: #fff; background: #164e63; box-shadow: 0 3px 12px rgb(0 0 0 / .15); cursor: pointer; }
.play-button:focus-visible { outline: 3px solid #22d3ee; outline-offset: 4px; }
.play-button svg { width: 32px; height: 32px; }
.block-controls { display: grid; grid-template-columns: repeat(6, minmax(44px, 1fr)); gap: 6px; margin-top: 12px; }
.block-controls button { touch-action: none; min-width: 0; }
.left-arrow { transform: rotate(-90deg); }
.right-arrow { transform: rotate(90deg); }
.down-arrow { transform: rotate(180deg); }
.clockwise { transform: scaleX(-1); }
.blocks-help { position: relative; }
.blocks-help[open] > summary { margin-bottom: 0; }
.blocks-help .arcade-note { position: absolute; right: 0; top: 52px; z-index: 10; width: min(310px, 80vw); background: #14242a; }
.blocks-help p { font-size: 14px; }
@media (min-width: 768px) { .blocks-board { width: min(100%, calc(50svh - 80px)); min-width: 220px; } }
@media (max-width: 767px) { .arcade-header { margin-bottom: 12px; } .arcade-score { min-width: 66px; padding: 6px 10px; } .arcade-score strong { font-size: 20px; } .arcade-toolbar { margin-bottom: 8px; } .piece-tray { margin-bottom: 6px; } }
@media (max-width: 400px) { .arcade-title { font-size: 26px; } .arcade-header { gap: 12px; } .block-controls { gap: 4px; } }
@media (max-width: 360px) and (max-height: 760px) { .blocks-board { width: min(100%, calc(50svh - 220px)); min-width: 156px; } .block-controls { margin-top: 8px; } }
</style>
