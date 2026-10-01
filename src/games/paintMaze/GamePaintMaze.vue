<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mazes, move, hint, validState, type Direction, type MazeState } from './logic'
import { readSaved, saveLocal } from '../shared/storage'
import { readProgress } from '../shared/puzzleProgress'
import GameIcon from '../shared/GameIcon.vue'
import '../shared/game-ui.css'
import '../shared/puzzle-ui.css'

const key = 'aoinatsu:paint-maze:v2'
const currentSave = readSaved(key)
const saved = readProgress(currentSave ?? readSaved('aoinatsu:paint-maze:v1'), mazes.length, [20, 10])
const level = ref(saved?.level ?? 0), unlocked = ref(saved?.unlocked ?? 0)
const best = ref(currentSave && saved ? saved.best : Array<number>(mazes.length).fill(0))
const maze = computed(() => mazes[level.value])
function fresh(): MazeState { return { position: maze.value.start, painted: [maze.value.start], moves: 0 } }
const state = ref<MazeState>(currentSave && saved && validState(maze.value, saved.state) ? saved.state : fresh())
const history = ref<MazeState[]>([]), suggested = ref<Direction | null>(null)
const stageElement = ref<HTMLElement | null>(null)
const floor = computed(() => new Set(maze.value.floor)), paint = computed(() => new Set(state.value.painted))
const won = computed(() => paint.value.size === floor.value.size)
const remaining = computed(() => floor.value.size - paint.value.size)
const arrows: { direction: Direction; label: string; angle: number }[] = [
  { direction: 'up', label: '向上', angle: 0 }, { direction: 'left', label: '向左', angle: -90 },
  { direction: 'down', label: '向下', angle: 180 }, { direction: 'right', label: '向右', angle: 90 },
]
function persist() { saveLocal(key, { level: level.value, unlocked: unlocked.value, best: best.value, state: state.value }) }
watch([state, level, unlocked, best], persist, { deep: true })
watch(won, value => {
  if (!value) return
  unlocked.value = Math.max(unlocked.value, Math.min(mazes.length - 1, level.value + 1))
  best.value[level.value] = best.value[level.value] ? Math.min(best.value[level.value], state.value.moves) : state.value.moves
}, { immediate: true })
function select(index: number) {
  if (index < 0 || index > unlocked.value) return
  level.value = index; state.value = fresh(); history.value = []; suggested.value = null
}
function startAdvanced() {
  unlocked.value = Math.max(unlocked.value, 10)
  select(10)
}
function startHard() {
  unlocked.value = Math.max(unlocked.value, 20)
  select(20)
}
function step(direction: Direction) {
  if (won.value) return
  stageElement.value?.focus({ preventScroll: true })
  const next = move(maze.value, state.value, direction)
  if (next === state.value) return
  history.value.push(state.value); if (history.value.length > 100) history.value.shift()
  state.value = next; suggested.value = null
}
function undo() { const previous = history.value.pop(); if (previous) state.value = previous; suggested.value = null }
function keydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const keys: Record<string, Direction> = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }
  const direction = keys[event.key] ?? keys[event.key.toLowerCase()]
  if (direction && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); step(direction) }
}
let pointer: { x: number; y: number; id: number } | null = null
function pointerdown(e: PointerEvent) {
  if (won.value || (e.target instanceof Element && e.target.closest('button'))) return
  pointer = { x: e.clientX, y: e.clientY, id: e.pointerId }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function pointerup(e: PointerEvent) {
  if (!pointer || pointer.id !== e.pointerId) return
  const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y; pointer = null
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
  step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
}
</script>

<template>
  <section class="arcade puzzle" @keydown="keydown">
    <header class="arcade-header">
      <h1 class="arcade-title">涂色迷宫</h1>
      <div class="arcade-stats"><div class="arcade-score"><span>关卡</span><strong>{{ level + 1 }} / {{ mazes.length }}</strong></div><div class="arcade-score"><span>步数</span><strong>{{ state.moves }}</strong></div></div>
    </header>
    <div class="arcade-layout">
      <div class="arcade-player">
        <div class="arcade-toolbar"><p>{{ maze.name }} · 剩 {{ remaining }} 格</p><div class="arcade-actions"><button class="arcade-button icon-button" :disabled="!history.length" aria-label="撤销" title="撤销" @click="undo"><GameIcon name="undo" /></button><button class="arcade-button icon-button" aria-label="重玩" title="重玩" @click="select(level)"><GameIcon name="reset" /></button><button class="arcade-button icon-button" :disabled="won" aria-label="提示" title="提示" @click="suggested = hint(maze, state)"><GameIcon name="hint" /></button></div></div>
        <div ref="stageElement" class="maze-stage" tabindex="0" role="group" aria-label="迷宫，使用方向键或滑动涂色" @pointerdown="pointerdown" @pointerup="pointerup" @pointercancel="pointer = null">
          <div class="maze-grid" :style="{ gridTemplateColumns: `repeat(${maze.size}, 1fr)` }" aria-hidden="true">
            <span v-for="(_, i) in maze.size ** 2" :key="`${level}-${i}`" class="maze-cell" :class="{ floor: floor.has(i), painted: paint.has(i) }" />
          </div>
          <div class="maze-ball" :style="{ width: `${100 / maze.size}%`, height: `${100 / maze.size}%`, left: `${state.position % maze.size * 100 / maze.size}%`, top: `${Math.floor(state.position / maze.size) * 100 / maze.size}%` }" aria-hidden="true"><span /></div>
          <div v-if="won" class="arcade-result"><h2>{{ level === mazes.length - 1 ? '全部涂完了' : '涂满了！' }}</h2><p>{{ state.moves }} 步 · 本关最佳 {{ best[level] }} 步</p><button class="arcade-button primary" @click="select(level < mazes.length - 1 ? level + 1 : 0)">{{ level < mazes.length - 1 ? '下一关' : '再玩一遍' }}</button></div>
        </div>
        <div class="maze-pad"><button v-for="arrow in arrows" :key="arrow.direction" class="arcade-button icon-button" :class="[arrow.direction, { primary: suggested === arrow.direction }]" :aria-label="arrow.label" :disabled="won" @click="step(arrow.direction)"><GameIcon name="arrow" :style="{ transform: `rotate(${arrow.angle}deg)` }" /></button></div>
        <p class="sr-only" role="status">{{ won ? '过关了' : `剩 ${remaining} 格` }}</p>
      </div>
      <aside class="arcade-notes">
        <details class="game-help"><summary aria-label="玩法" title="玩法"><GameIcon name="help" /></summary><div class="arcade-note"><p>滑动或按方向键 / WASD，小球撞墙才停。涂满所有白格过关。</p></div></details>
        <button class="arcade-button advanced-entry" @click="startAdvanced">从第 11 关开始</button>
        <button class="arcade-button advanced-entry" @click="startHard">挑战难关 · 第 21 关</button>
        <div class="puzzle-levels" aria-label="选择关卡"><button v-for="(_, i) in mazes" :key="i" class="arcade-button" :class="{ primary: i === level, completed: best[i] }" :disabled="i > unlocked" :aria-label="`第 ${i + 1} 关${best[i] ? '，已通过' : ''}`" :aria-current="i === level ? 'step' : undefined" @click="select(i)">{{ i + 1 }}<span v-if="best[i]">✓</span></button></div>
        <p class="arcade-save-note">自动存档</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.maze-stage { position: relative; aspect-ratio: 1; border-radius: 18px; overflow: hidden; background: #273a44; touch-action: none; outline-offset: 4px; box-shadow: 0 12px 32px #0003; }
.maze-stage:focus-visible { outline: 2px solid #22d3ee; }
.maze-grid { display: grid; width: 100%; height: 100%; }
.maze-cell { background: #273a44; box-shadow: inset 0 0 0 1px #ffffff03; }
.maze-cell.floor { background: #eff1e9; box-shadow: inset 0 0 0 1px #d8ded4; }
.maze-cell.painted { background: #89c8a6; box-shadow: inset 0 0 0 1px #75b895; transition: background 180ms; }
.maze-ball { position: absolute; display: grid; place-items: center; transition: left 180ms ease-out, top 180ms ease-out; pointer-events: none; }
.maze-ball span { width: 83%; height: 83%; border-radius: 50%; background: radial-gradient(circle at 32% 28%, #fafef1, #ecbc5f 55%, #c88834); border: 2px solid #fff8; box-shadow: 0 3px 5px #1235; }
.maze-pad { display: grid; grid-template-columns: repeat(3, 54px); grid-template-rows: repeat(2, 48px); justify-content: center; gap: 6px; margin-top: 16px; }
.maze-pad button { font-size: 24px; padding: 0; }.maze-pad .up { grid-column: 2; }.maze-pad .left { grid-row: 2; grid-column: 1; }.maze-pad .down { grid-row: 2; grid-column: 2; }.maze-pad .right { grid-row: 2; grid-column: 3; }
.advanced-entry { width: 100%; margin-top: 18px; }
@media (prefers-reduced-motion: reduce) { .maze-ball, .maze-cell.painted { transition: none; } }
</style>
