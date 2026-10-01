<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { canMove, isValidBoard, moveBoard, spawnTile, type Direction } from './logic'
import { readBest, readSaved, saveLocal } from '../shared/storage'
import GameIcon from '../shared/GameIcon.vue'
import '../shared/game-ui.css'

interface Snapshot { board: number[]; score: number; keepPlaying: boolean }
interface Tile { id: number; index: number; value: number }

const saveKey = 'aoinatsu:2048:session:v1'
const bestKey = 'aoinatsu:2048:best:v1'
let tileId = 0

function freshBoard() {
  return spawnTile(spawnTile(Array<number>(16).fill(0)).board).board
}

function makeTiles(values: readonly number[]): Tile[] {
  return values.flatMap((value, index) => value ? [{ id: tileId++, index, value }] : [])
}

const data = readSaved(saveKey) as Partial<Snapshot> | null
const saved = data && isValidBoard(data.board) && typeof data.score === 'number'
  && Number.isSafeInteger(data.score) && data.score >= 0 && typeof data.keepPlaying === 'boolean' ? data as Snapshot : null
const tiles = ref(makeTiles(saved?.board ?? freshBoard()))
const score = ref(saved?.score ?? 0)
const best = ref(Math.max(readBest(bestKey), score.value))
const keepPlaying = ref(saved?.keepPlaying ?? false)
const previous = ref<Snapshot | null>(null)
const gain = ref(0)
const turn = ref(0)
const boardElement = ref<HTMLElement | null>(null)
const board = computed(() => {
  const values = Array<number>(16).fill(0)
  tiles.value.forEach(tile => { values[tile.index] = tile.value })
  return values
})
const won = computed(() => board.value.some(value => value >= 2048) && !keepPlaying.value)
const over = computed(() => !canMove(board.value))

function persist() {
  saveLocal(saveKey, { board: board.value, score: score.value, keepPlaying: keepPlaying.value })
  saveLocal(bestKey, best.value)
}

watch([board, score, best, keepPlaying], persist)
onMounted(() => { persist(); focusBoard() })
onBeforeUnmount(persist)

function focusBoard() { boardElement.value?.focus({ preventScroll: true }) }

function move(direction: Direction) {
  if (won.value || over.value) return
  const result = moveBoard(board.value, direction)
  if (!result.changed) return
  previous.value = { board: [...board.value], score: score.value, keepPlaying: keepPlaying.value }
  const oldTiles = new Map(tiles.value.map(tile => [tile.index, tile]))
  const nextTiles = result.placements.map(({ from, to, value }) => ({
    id: oldTiles.get(from)!.id, index: to, value,
  }))
  const spawned = spawnTile(result.board)
  if (spawned.index >= 0) nextTiles.push({ id: tileId++, index: spawned.index, value: spawned.board[spawned.index] })
  tiles.value = nextTiles
  score.value += result.score
  best.value = Math.max(best.value, score.value)
  gain.value = result.score
  turn.value++
}

function restart() {
  tiles.value = makeTiles(freshBoard())
  score.value = 0
  keepPlaying.value = false
  previous.value = null
  gain.value = 0
  nextTick(focusBoard)
}

function undo() {
  if (!previous.value) return
  const snapshot = previous.value
  tiles.value = makeTiles(snapshot.board)
  score.value = snapshot.score
  keepPlaying.value = snapshot.keepPlaying
  previous.value = null
  gain.value = 0
  nextTick(focusBoard)
}

function continuePlaying() { keepPlaying.value = true; nextTick(focusBoard) }

const keys: Record<string, Direction> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
}
function onKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.altKey || event.metaKey) return
  const direction = keys[event.key] ?? keys[event.key.toLowerCase()]
  if (direction) { event.preventDefault(); move(direction) }
}

let swipe: { x: number; y: number; pointerId: number } | null = null
function startSwipe(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
  focusBoard()
  swipe = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
  boardElement.value?.setPointerCapture(event.pointerId)
}
function endSwipe(event: PointerEvent) {
  if (!swipe || swipe.pointerId !== event.pointerId) return
  const dx = event.clientX - swipe.x
  const dy = event.clientY - swipe.y
  swipe = null
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
}

const directions: { direction: Direction; label: string; angle: number }[] = [
  { direction: 'up', label: '向上移动', angle: 0 },
  { direction: 'left', label: '向左移动', angle: -90 },
  { direction: 'down', label: '向下移动', angle: 180 },
  { direction: 'right', label: '向右移动', angle: 90 },
]
function buttonMove(direction: Direction) { focusBoard(); move(direction) }

const colors: Record<number, [string, string]> = {
  2: ['#293b46', '#deebf0'], 4: ['#22515e', '#d2f5fa'],
  8: ['#216e7c', '#e4fcff'], 16: ['#14818c', '#f0ffff'],
  32: ['#15969e', '#ffffff'], 64: ['#0e7490', '#ffffff'],
  128: ['#0369a1', '#ffffff'], 256: ['#99dfec', '#173d47'],
  512: ['#f2d692', '#513e1d'], 1024: ['#efb26d', '#4b2d16'],
  2048: ['#f78d71', '#421f1a'],
}
function tileStyle(value: number) {
  const [background, color] = colors[value] ?? ['#b09ae8', '#271a46']
  return { background, color }
}
function tileLabel(value: number) { return value >= 1e6 ? `2^${Math.log2(value)}` : value }
</script>

<template>
  <div class="game-2048">
    <header class="flex flex-wrap items-center justify-between gap-4 mb-7">
      <div>
        <h1 class="text-5xl sm:text-6xl font-bold tracking-tight text-stone-100">2048</h1>
      </div>
      <div class="flex gap-2">
        <div class="score-box relative">
          <span class="score-label">得分</span>
          <span class="score-value">{{ score }}</span>
          <span v-if="gain" :key="turn" aria-hidden="true" class="score-gain">+{{ gain }}</span>
        </div>
        <div class="score-box">
          <span class="score-label">最高分</span>
          <span class="score-value text-cyan-200">{{ best }}</span>
        </div>
      </div>
    </header>

    <div class="game-layout">
      <section class="w-full min-w-0 max-w-[440px] mx-auto">
        <div class="flex items-center justify-between gap-2 mb-4">
          <span class="text-xs text-stone-500">{{ keepPlaying ? '继续合并' : '目标 2048' }}</span>
          <div class="flex gap-2 shrink-0">
            <button class="game-button icon-button" :disabled="!previous" aria-label="撤回" title="撤回" @click="undo"><GameIcon name="undo" /></button>
            <button class="game-button icon-button primary" aria-label="新一局" title="新一局" @click="restart"><GameIcon name="reset" /></button>
          </div>
        </div>

        <div
          ref="boardElement"
          class="board"
          tabindex="0"
          role="group"
          aria-label="2048 棋盘"
          aria-describedby="instructions-2048"
          @keydown="onKey"
          @pointerdown="startSwipe"
          @pointerup="endSwipe"
          @pointercancel="swipe = null"
        >
          <div class="board-inner">
            <div class="board-cells" aria-hidden="true">
              <div v-for="cell in 16" :key="cell" class="cell" />
            </div>
            <TransitionGroup name="tile" tag="div" class="board-tiles" aria-hidden="true">
              <div
                v-for="tile in tiles"
                :key="tile.id"
                class="tile"
                :style="{ '--column': tile.index % 4, '--row': Math.floor(tile.index / 4) }"
              >
                <span :key="tile.value" class="tile-face" :class="{ 'tile-small': tile.value >= 1024, 'tile-tiny': tile.value >= 100000 }" :style="tileStyle(tile.value)">{{ tileLabel(tile.value) }}</span>
              </div>
            </TransitionGroup>
          </div>
          <div class="sr-only">
            <p v-for="row in 4" :key="row">第 {{ row }} 行：{{ board.slice((row - 1) * 4, row * 4).map(value => value || '空').join('，') }}</p>
          </div>

          <Transition name="result">
            <div v-if="won || over" class="board-result">
              <h2 class="text-3xl font-bold text-stone-100">{{ won ? '合出 2048 了！' : '这一局结束了' }}</h2>
              <p class="text-sm text-stone-300 mt-3">得分 {{ score }}</p>
              <div class="flex flex-wrap justify-center gap-2 mt-6">
                <button v-if="won" class="game-button primary" @click="continuePlaying">继续玩</button>
                <button v-else-if="previous" class="game-button" @click="undo">撤回一步</button>
                <button class="game-button" :class="{ primary: !won }" @click="restart">再来一局</button>
              </div>
            </div>
          </Transition>
        </div>

        <div class="flex items-center justify-center gap-2 mt-5" aria-label="方向操作">
          <button v-for="item in directions" :key="item.direction" class="direction-button" :aria-label="item.label" :disabled="won || over" @click="buttonMove(item.direction)"><GameIcon name="arrow" :style="{ transform: `rotate(${item.angle}deg)` }" /></button>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" class="sr-only">得分 {{ score }}，最高分 {{ best }}。{{ won ? '合出 2048 了。' : over ? '游戏结束。' : '' }}</p>
      </section>

      <aside class="game-notes">
        <details class="game-help">
          <summary aria-label="玩法" title="玩法"><GameIcon name="help" /></summary>
          <div class="rounded-2xl border border-white/[0.06] bg-stone-900/40 p-5">
          <p id="instructions-2048" class="text-sm text-stone-400 leading-7">滑动或按方向键 / WASD，相同数字会合并。</p>
          <div class="flex items-center gap-2 mt-4 mb-4" aria-label="两个 2 合成一个 4">
            <span class="example-tile">2</span><span class="text-stone-500 text-xs">+</span><span class="example-tile">2</span><span class="text-stone-500 text-xs">=</span><span class="example-tile merged">4</span>
          </div>
          <p class="text-sm text-stone-400 leading-7">每次有效移动会出现一个 2 或 4。合出 2048 就赢了，无法移动时结束。</p>
          </div>
        </details>
        <p class="text-xs text-stone-500 leading-6 px-1 mt-5">自动存档</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.game-layout { display: grid; grid-template-columns: minmax(0, 440px) minmax(0, 1fr); gap: 28px; align-items: start; }
.score-box { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 78px; padding: 10px 14px; border: 1px solid rgb(255 255 255 / 0.07); border-radius: 12px; background: rgb(28 25 23 / 0.6); }
.score-label { color: #a8a29e; font-size: 11px; margin-bottom: 3px; }
.score-value { color: #e7e5e4; font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
.score-value.text-cyan-200 { color: #a5f3fc; }
.score-gain { position: absolute; top: 24px; color: #67e8f9; font-size: 18px; font-weight: 600; pointer-events: none; animation: score-rise 0.9s ease-out forwards; }
.game-button { padding: 7px 13px; border-radius: 9px; border: 1px solid #44403c; background: rgb(28 25 23 / 0.8); color: #d6d3d1; font-size: 12px; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
.game-button:hover:not(:disabled) { background: #292524; border-color: #78716c; }
.game-button.primary { background: #164e63; border-color: #155e75; color: #cffafe; }
.game-button.primary:hover { background: #155e75; border-color: #0891b2; }
.game-button:disabled, .direction-button:disabled { opacity: 0.35; cursor: default; }
.game-button:focus-visible, .direction-button:focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }
.game-button { min-height: 44px; }
.game-button.icon-button { display: inline-grid; place-items: center; padding: 9px; min-width: 44px; }
.board { --gap: 10px; position: relative; padding: 12px; border: 1px solid rgb(103 232 249 / 0.12); border-radius: 18px; background: #111c23; box-shadow: 0 16px 50px rgb(0 0 0 / 0.15); touch-action: pinch-zoom; user-select: none; -webkit-user-select: none; }
.board:focus { outline: none; }
.board:focus-visible { outline: 2px solid rgb(34 211 238 / 0.6); outline-offset: 4px; }
.board-inner { position: relative; width: 100%; aspect-ratio: 1; }
.board-cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: var(--gap); position: absolute; inset: 0; }
.cell { background: rgb(255 255 255 / 0.04); border-radius: 9px; }
.board-tiles { position: absolute; inset: 0; pointer-events: none; }
.tile { position: absolute; width: calc((100% - 3 * var(--gap)) / 4); height: calc((100% - 3 * var(--gap)) / 4); left: calc(var(--column) * (100% + var(--gap)) / 4); top: calc(var(--row) * (100% + var(--gap)) / 4); transition: left 0.14s ease, top 0.14s ease; }
.tile-face { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 9px; font-size: clamp(24px, 6vw, 38px); font-weight: 700; font-variant-numeric: tabular-nums; box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.1); animation: tile-pop 0.18s ease-out; }
.tile-face.tile-small { font-size: clamp(19px, 4.5vw, 28px); }
.tile-face.tile-tiny { font-size: clamp(13px, 3.2vw, 20px); }
.tile-leave-active { transition: opacity 0.1s; }
.tile-leave-to { opacity: 0; }
.board-result { position: absolute; inset: 0; z-index: 2; border-radius: 17px; background: rgb(12 23 30 / 0.9); backdrop-filter: blur(5px); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 18px; }
.result-enter-active, .result-leave-active { transition: opacity 0.2s; }
.result-enter-from, .result-leave-to { opacity: 0; }
.direction-button { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 10px; border: 1px solid #383d3e; color: #a8c6d0; background: rgb(20 31 38 / 0.7); font-size: 21px; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
.direction-button:hover:not(:disabled) { background: #183c49; border-color: #155e75; }
.example-tile { display: flex; width: 36px; height: 36px; align-items: center; justify-content: center; background: #293b46; color: #deebf0; border-radius: 7px; font-weight: 600; }
.example-tile.merged { background: #22515e; color: #d2f5fa; }
@keyframes tile-pop { from { opacity: 0.65; transform: scale(0.75); } to { opacity: 1; transform: scale(1); } }
@keyframes score-rise { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-42px); } }
@media (max-width: 767px) { .game-layout { grid-template-columns: minmax(0, 1fr); gap: 28px; } .game-notes { width: 100%; max-width: 440px; margin: 0 auto; } }
@media (max-width: 380px) { .board { --gap: 7px; padding: 9px; border-radius: 14px; } .score-box { min-width: 70px; padding: 8px 10px; } }
@media (pointer: coarse) { .game-button { min-height: 44px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } .score-gain { display: none; } }
</style>
