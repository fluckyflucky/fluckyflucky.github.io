<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { adjacent, collapseBoard, createBoard, findMatches, findMove, SIZE, validBoard } from './logic'
import { fruits } from './fruits'
import { readBest, readSaved, saveLocal } from '../shared/storage'
import GameIcon from '../shared/GameIcon.vue'
import '../shared/game-ui.css'

interface Piece { id: number; index: number; type: number }
interface Save { board: number[]; score: number; moves: number }
const saveKey = 'aoinatsu:match3:session:v1', bestKey = 'aoinatsu:match3:best:v1'
let pieceId = 0
function makePieces(board: readonly number[]): Piece[] { return board.map((type, index) => ({ id: pieceId++, index, type })) }
const value = readSaved(saveKey) as Partial<Save> | null
const saved = value && validBoard(value.board) && typeof value.score === 'number'
    && Number.isSafeInteger(value.score) && value.score >= 0 && typeof value.moves === 'number'
    && Number.isInteger(value.moves) && value.moves >= 0 && value.moves <= 30
    && (value.moves === 0 || findMove(value.board))
    ? { board: value.board, score: value.score, moves: value.moves } : null
const pieces = ref(makePieces(saved?.board ?? createBoard()))
const score = ref(saved?.score ?? 0), moves = ref(saved?.moves ?? 30)
const best = ref(Math.max(readBest(bestKey), score.value))
const selected = ref<number | null>(null), hints = ref<number[]>([]), busy = ref(false)
const notice = ref(''), combo = ref(0), focused = ref(0)
const boardElement = ref<HTMLElement | null>(null)
const board = computed(() => {
  const value = Array<number>(SIZE * SIZE).fill(-1)
  pieces.value.forEach(piece => { value[piece.index] = piece.type })
  return value
})
const over = computed(() => moves.value === 0 && !busy.value)
let disposed = false, timer: ReturnType<typeof setTimeout> | null = null
let finishWait: ((value: boolean) => void) | null = null
let lastStable: Save | null = null
function pause(ms: number): Promise<boolean> {
  return new Promise(resolve => {
    finishWait = resolve
    timer = setTimeout(() => { timer = null; finishWait = null; resolve(!disposed) }, ms)
  })
}
function persist() {
  if (busy.value || !validBoard(board.value)) return
  lastStable = { board: [...board.value], score: score.value, moves: moves.value }
  saveLocal(saveKey, lastStable)
  saveLocal(bestKey, best.value)
}
watch([board, score, moves, busy, best], persist)
persist()
onBeforeUnmount(() => {
  disposed = true
  if (timer) clearTimeout(timer)
  finishWait?.(false)
  if (lastStable) saveLocal(saveKey, lastStable)
  saveLocal(bestKey, best.value)
})

function exchange(a: number, b: number) {
  pieces.value = pieces.value.map(piece => ({ ...piece, index: piece.index === a ? b : piece.index === b ? a : piece.index }))
}

async function swap(a: number, b: number) {
  if (busy.value || over.value || !adjacent(a, b)) return
  selected.value = null; hints.value = []; combo.value = 0; busy.value = true
  exchange(a, b)
  if (!await pause(150)) return
  let matched = findMatches(board.value)
  if (!matched.size) {
    exchange(a, b)
    if (!await pause(150)) return
    busy.value = false
    notice.value = '这两块不能消除。'
    return
  }
  moves.value--
  let chain = 0
  while (matched.size) {
    chain++
    combo.value = chain
    score.value += matched.size * 10 * chain
    best.value = Math.max(best.value, score.value)
    const current = [...board.value]
    const old = new Map(pieces.value.map(piece => [piece.index, piece]))
    const fallen = collapseBoard(current, matched)
    pieces.value = pieces.value.filter(piece => !matched.has(piece.index))
    if (!await pause(180)) return
    pieces.value = [
      ...fallen.placements.map(({ from, to, type }) => ({ id: old.get(from)!.id, index: to, type })),
      ...fallen.added.map(({ index, type }) => ({ id: pieceId++, index, type })),
    ]
    if (!await pause(220)) return
    matched = findMatches(board.value)
  }
  if (moves.value > 0 && !findMove(board.value)) {
    pieces.value = makePieces(createBoard())
    notice.value = '没有可消除的组合，已换盘。'
  } else notice.value = ''
  busy.value = false
  focused.value = a
  nextTick(() => boardElement.value?.querySelector<HTMLButtonElement>(`[data-cell="${a}"]`)?.focus({ preventScroll: true }))
}

let ignoreClickUntil = 0
function choose(index: number) {
  if (busy.value || over.value || performance.now() < ignoreClickUntil) return
  hints.value = []
  if (selected.value === index) selected.value = null
  else if (selected.value !== null && adjacent(selected.value, index)) void swap(selected.value, index)
  else selected.value = index
}

function hint() {
  const pair = findMove(board.value)
  hints.value = pair ?? []
  selected.value = null
  notice.value = ''
}
function restart() {
  if (busy.value) return
  pieces.value = makePieces(createBoard()); score.value = 0; moves.value = 30
  selected.value = null; hints.value = []; combo.value = 0
  notice.value = ''
}

let swipe: { index: number; x: number; y: number; pointerId: number } | null = null
function startSwipe(event: PointerEvent, index: number) {
  if (!event.isPrimary || event.button !== 0 || busy.value || over.value) return
  swipe = { index, x: event.clientX, y: event.clientY, pointerId: event.pointerId }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function endSwipe(event: PointerEvent) {
  if (!swipe || swipe.pointerId !== event.pointerId) return
  const { index, x, y } = swipe
  swipe = null
  const dx = event.clientX - x, dy = event.clientY - y
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
  ignoreClickUntil = performance.now() + 400
  const next = index + (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? SIZE : -SIZE))
  if (next >= 0 && next < SIZE * SIZE && adjacent(index, next)) void swap(index, next)
}

function onKey(event: KeyboardEvent, index: number) {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const arrows: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -SIZE, ArrowDown: SIZE }
  const offset = arrows[event.key]
  if (offset === undefined) return
  event.preventDefault()
  const next = index + offset
  if (next >= 0 && next < SIZE * SIZE && adjacent(index, next)) {
    boardElement.value?.querySelector<HTMLElement>(`[data-cell="${next}"]`)?.focus()
  }
}
</script>

<template>
  <div class="arcade match3">
    <header class="arcade-header">
      <h1 class="arcade-title">消消乐</h1>
      <div class="arcade-stats">
        <div class="arcade-score"><span>得分</span><strong>{{ score }}</strong></div>
        <div class="arcade-score"><span>最高分</span><strong>{{ best }}</strong></div>
        <div class="arcade-score"><span>剩余步数</span><strong>{{ moves }}</strong></div>
      </div>
    </header>
    <div class="arcade-layout">
      <section class="arcade-player">
        <div class="arcade-toolbar">
          <p>30 步</p>
          <div class="arcade-actions">
            <button class="arcade-button icon-button" :disabled="busy || over" aria-label="提示" title="提示" @click="hint"><GameIcon name="hint" /></button>
            <button class="arcade-button icon-button primary" :disabled="busy" aria-label="新一局" title="新一局" @click="restart"><GameIcon name="reset" /></button>
          </div>
        </div>
        <div ref="boardElement" class="fruit-board" role="group" aria-label="消消乐棋盘" :aria-busy="busy">
          <div class="fruit-inner">
            <div class="fruit-cells" aria-hidden="true"><span v-for="cell in SIZE * SIZE" :key="cell" /></div>
            <TransitionGroup tag="div" name="fruit" class="fruit-layer">
              <button
                v-for="piece in pieces" :key="piece.id" class="fruit-piece"
                :class="{ selected: selected === piece.index, hinted: hints.includes(piece.index) }"
                :style="{ '--col': piece.index % SIZE, '--row': Math.floor(piece.index / SIZE), '--fruit-color': fruits[piece.type].color }"
                :data-cell="piece.index" :data-kind="piece.type"
                :tabindex="focused === piece.index ? 0 : -1"
                :aria-label="`第 ${Math.floor(piece.index / SIZE) + 1} 行第 ${piece.index % SIZE + 1} 列，${fruits[piece.type].name}`"
                :aria-pressed="selected === piece.index"
                :disabled="busy || over"
                @focus="focused = piece.index" @click="choose(piece.index)" @pointerdown="startSwipe($event, piece.index)"
                @pointerup="endSwipe" @pointercancel="swipe = null" @keydown="onKey($event, piece.index)"
              ><img :src="fruits[piece.type].image" alt="" draggable="false" /></button>
            </TransitionGroup>
          </div>
          <div v-if="over" class="arcade-result">
            <h2>这一局结束了</h2><p>得分 {{ score }}</p>
            <button class="arcade-button primary" @click="restart">再来一局</button>
          </div>
          <span v-if="combo > 1 && busy" :key="combo" class="combo-badge" aria-hidden="true">{{ combo }} 连消</span>
        </div>
        <p class="arcade-status" role="status" aria-live="polite">{{ notice }}</p>
      </section>
      <aside class="arcade-notes">
        <details class="game-help">
          <summary aria-label="玩法" title="玩法"><GameIcon name="help" /></summary>
          <div class="arcade-note"><p>点选或滑动交换相邻水果，横竖凑齐三个即可消除。</p>
          <div class="fruit-example" aria-hidden="true"><img v-for="i in 3" :key="i" :src="fruits[0].image" alt="" /><span>→ 消除</span></div>
          <p>每局 30 步。只有成功消除才扣步数，连消有额外加分。</p>
          <p>没有可消除的组合时换盘。</p></div>
        </details>
        <p class="arcade-save-note">自动存档</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.fruit-board { --gap: 6px; position: relative; border: 1px solid rgb(125 211 252 / 0.13); border-radius: 18px; background: #12222a; padding: 10px; user-select: none; touch-action: pinch-zoom; }
.fruit-inner { aspect-ratio: 1; position: relative; }
.fruit-cells { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); grid-template-rows: repeat(6, minmax(0, 1fr)); gap: var(--gap); }
.fruit-cells span { border-radius: 10px; background: rgb(255 255 255 / 0.035); }
.fruit-layer { position: absolute; inset: 0; }
.fruit-piece { position: absolute; left: calc(var(--col) * (100% + var(--gap)) / 6); top: calc(var(--row) * (100% + var(--gap)) / 6); width: calc((100% - 5 * var(--gap)) / 6); height: calc((100% - 5 * var(--gap)) / 6); border-radius: 10px; border: 1px solid transparent; display: grid; place-items: center; cursor: pointer; touch-action: pinch-zoom; transition: left 0.15s ease, top 0.2s ease, background 0.15s; }
.fruit-piece img { width: 85%; height: 85%; filter: drop-shadow(0 3px 2px rgb(0 0 0 / 0.2)); pointer-events: none; }
.fruit-piece:hover:not(:disabled) { background: rgb(255 255 255 / 0.06); }
.fruit-piece.selected { border-color: var(--fruit-color); background: color-mix(in srgb, var(--fruit-color) 18%, transparent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--fruit-color) 20%, transparent); }
.fruit-piece.hinted { border-color: #fcd34d; background: rgb(252 211 77 / 0.1); animation: hint-pulse 0.7s ease-in-out infinite alternate; }
.fruit-piece:focus-visible { outline: 2px solid #22d3ee; outline-offset: 1px; }
.fruit-enter-active { animation: fruit-in 0.2s ease-out; }
.fruit-leave-active { transition: transform 0.16s, opacity 0.16s; pointer-events: none; }
.fruit-leave-to { transform: scale(0.3); opacity: 0; }
.fruit-example { display: flex; align-items: center; gap: 4px; margin: 16px 0; }
.fruit-example img { width: 32px; height: 32px; }
.fruit-example span { color: #78716c; font-size: 12px; margin-left: 8px; }
.combo-badge { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); border: 1px solid rgb(252 211 77 / 0.5); background: rgb(32 35 28 / 0.9); color: #fde68a; border-radius: 12px; padding: 10px 20px; font-size: 22px; font-weight: 700; pointer-events: none; animation: combo-pop 0.2s ease-out; }
@keyframes combo-pop { from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@keyframes fruit-in { from { opacity: 0; transform: translateY(-10px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes hint-pulse { from { box-shadow: 0 0 0 0 rgb(252 211 77 / 0.1); } to { box-shadow: 0 0 0 3px rgb(252 211 77 / 0.3); } }
@media (max-width: 380px) { .fruit-board { --gap: 4px; padding: 7px; } .arcade-toolbar { flex-wrap: wrap; } .arcade-stats { width: 100%; } .arcade-score { flex: 1; } }
</style>
