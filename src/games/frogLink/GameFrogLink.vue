<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { COLS, ROWS, connection, findPair, fresh, reshuffle, validSave, type Point } from './logic'
import { frogTiles } from '../frogArt/art'
import { readSaved, saveLocal } from '../shared/storage'
import GameIcon from '../shared/GameIcon.vue'
import '../shared/game-ui.css'

const saveKey = 'aoinatsu:frog-link:session:v1'
const saved = readSaved(saveKey)
const game = ref(validSave(saved) ? saved : fresh())
const selected = ref<number | null>(null), hintPair = ref<number[]>([]), rejected = ref<number[]>([])
const path = ref<Point[]>([]), removing = ref<number[]>([]), paused = ref(false), confirmReset = ref(false)
const focused = ref(game.value.board.findIndex(v => v >= 0)), boardElement = ref<HTMLElement | null>(null)
const remaining = computed(() => game.value.board.filter(v => v >= 0).length / 2)
const over = computed(() => remaining.value === 0)
const busy = computed(() => removing.value.length > 0)
const notice = ref('')
const time = computed(() => `${Math.floor(game.value.elapsed / 60)}:${String(game.value.elapsed % 60).padStart(2, '0')}`)
const points = computed(() => path.value.map(p => `${p.x === 0 ? -.23 : p.x === COLS + 1 ? COLS + .23 : p.x - .5},${p.y === 0 ? -.23 : p.y === ROWS + 1 ? ROWS + .23 : p.y - .5}`).join(' '))
let animation: ReturnType<typeof setTimeout> | undefined, feedback: ReturnType<typeof setTimeout> | undefined
let clock: ReturnType<typeof setInterval> | undefined
function persist() { saveLocal(saveKey, game.value) }

function keepPlayable() {
  if (remaining.value && !findPair(game.value.board)) {
    game.value.board = reshuffle(game.value.board)
    notice.value = '没有可连的了，已重排'
  }
}

function finishPair() {
  if (!busy.value) return
  for (const index of removing.value) game.value.board[index] = -1
  removing.value = []; path.value = []
  keepPlayable()
  focused.value = game.value.board.findIndex(v => v >= 0)
  persist()
}

function choose(index: number) {
  if (busy.value || paused.value || confirmReset.value || over.value || game.value.board[index] < 0) return
  game.value.started = true; hintPair.value = []; rejected.value = []; notice.value = ''
  if (selected.value === index) { selected.value = null; return }
  if (selected.value === null || game.value.board[selected.value] !== game.value.board[index]) {
    selected.value = index; persist(); return
  }
  const a = selected.value, route = connection(game.value.board, a, index)
  selected.value = null
  if (!route) {
    rejected.value = [a, index]
    clearTimeout(feedback)
    feedback = setTimeout(() => { rejected.value = [] }, 350)
    return
  }
  path.value = route; removing.value = [a, index]
  animation = setTimeout(() => {
    finishPair()
    nextTick(() => boardElement.value?.querySelector<HTMLButtonElement>(`[data-cell="${focused.value}"]`)?.focus({ preventScroll: true }))
  }, 220)
}

function hint() {
  if (busy.value || paused.value || confirmReset.value || over.value) return
  keepPlayable()
  hintPair.value = findPair(game.value.board) ?? []
  selected.value = null
  persist()
}
function rearrange() {
  if (busy.value || paused.value || confirmReset.value || over.value) return
  game.value.board = reshuffle(game.value.board)
  selected.value = null; hintPair.value = []; rejected.value = []; notice.value = ''
  persist()
}
function restart() {
  clearTimeout(animation); clearTimeout(feedback)
  game.value = fresh(); paused.value = false; confirmReset.value = false
  selected.value = null; hintPair.value = []; rejected.value = []; path.value = []; removing.value = []; notice.value = ''
  focused.value = 0; persist()
}
function requestRestart() {
  if (busy.value) return
  if (!game.value.started || over.value) restart()
  else confirmReset.value = true
}
function onKey(event: KeyboardEvent, index: number) {
  if (event.ctrlKey || event.metaKey || event.altKey || busy.value || paused.value || confirmReset.value) return
  const direction: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS }
  const step = direction[event.key]
  if (step === undefined) return
  event.preventDefault()
  let next = index + step
  while (next >= 0 && next < COLS * ROWS && (Math.abs(step) !== 1 || Math.floor(next / COLS) === Math.floor(index / COLS))) {
    if (game.value.board[next] >= 0) {
      focused.value = next
      boardElement.value?.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`)?.focus({ preventScroll: true })
      break
    }
    next += step
  }
}
function visibility() {
  if (document.hidden) { paused.value = game.value.started && !over.value; persist() }
}
onMounted(() => {
  keepPlayable(); persist()
  clock = setInterval(() => {
    if (game.value.started && !paused.value && !confirmReset.value && !over.value && !document.hidden) { game.value.elapsed++; persist() }
  }, 1000)
  document.addEventListener('visibilitychange', visibility)
})
onBeforeUnmount(() => {
  clearInterval(clock); clearTimeout(animation); clearTimeout(feedback)
  finishPair(); persist()
  document.removeEventListener('visibilitychange', visibility)
})
</script>

<template>
  <div class="arcade frog-link">
    <header class="arcade-header">
      <h1 class="arcade-title">奶蛙连连看</h1>
      <div class="arcade-stats">
        <div class="arcade-score"><span>剩余</span><strong>{{ remaining }}<small> 对</small></strong></div>
        <div class="arcade-score"><span>用时</span><strong>{{ time }}</strong></div>
      </div>
    </header>
    <section class="link-player">
      <div class="arcade-toolbar">
        <div class="arcade-actions">
          <button class="arcade-button icon-button" aria-label="提示" title="提示" :disabled="busy || paused || over || confirmReset" @click="hint"><GameIcon name="hint" /></button>
          <button class="arcade-button icon-button" aria-label="重排" title="重排" :disabled="busy || paused || over || confirmReset" @click="rearrange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h3c4 0 8 10 12 10h3m-4-4 4 4-4 4M3 17h3c2 0 4-3 6-5m2-2c1-2 3-3 4-3h3m-4-4 4 4-4 4" /></svg>
          </button>
        </div>
        <div class="arcade-actions">
          <button class="arcade-button icon-button" :aria-label="paused ? '继续' : '暂停'" :title="paused ? '继续' : '暂停'" :disabled="busy || over || confirmReset" @click="paused = !paused"><GameIcon :name="paused ? 'play' : 'pause'" /></button>
          <button class="arcade-button icon-button primary" aria-label="新一局" title="新一局" :disabled="busy" @click="requestRestart"><GameIcon name="reset" /></button>
          <details class="game-help link-help"><summary aria-label="玩法" title="玩法"><GameIcon name="help" /></summary><div class="arcade-note"><p>两张相同的图，连线最多拐两次弯，可以绕过棋盘边缘。</p></div></details>
        </div>
      </div>
      <div ref="boardElement" class="link-board" role="group" aria-label="连连看棋盘" :aria-busy="busy">
        <div class="link-grid">
          <div v-for="(kind, index) in game.board" :key="index" class="link-slot">
            <button v-if="kind >= 0" class="link-tile" :data-cell="index" :data-kind="kind"
              :class="{ selected: selected === index, hinted: hintPair.includes(index), rejected: rejected.includes(index), removing: removing.includes(index) }"
              :disabled="busy || paused || confirmReset || over" :tabindex="focused === index ? 0 : -1"
              :aria-label="`第 ${Math.floor(index / COLS) + 1} 行第 ${index % COLS + 1} 列，${frogTiles[kind].name}`"
              :aria-pressed="selected === index" @focus="focused = index" @click="choose(index)" @keydown="onKey($event, index)">
              <img :src="frogTiles[kind].image" alt="" draggable="false" />
            </button>
          </div>
        </div>
        <svg v-if="path.length" class="link-line" viewBox="0 0 6 8" preserveAspectRatio="none" aria-hidden="true"><polyline :points="points" fill="none" stroke="#22d3ee" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" /></svg>
        <div v-if="paused || over || confirmReset" class="arcade-result">
          <template v-if="confirmReset"><h2>重开这一局？</h2><div class="arcade-actions"><button class="arcade-button" @click="confirmReset = false">取消</button><button class="arcade-button primary" @click="restart">重开</button></div></template>
          <template v-else-if="over"><h2>清空了</h2><p>{{ time }}</p><button class="arcade-button primary" @click="restart">再来一局</button></template>
          <template v-else><button class="arcade-button icon-button primary" aria-label="继续" title="继续" @click="paused = false"><GameIcon name="play" /></button></template>
        </div>
      </div>
      <p class="arcade-status" role="status">{{ notice }}</p>
    </section>
  </div>
</template>

<style scoped>
.link-player { width: 100%; max-width: 440px; margin: auto; }
.arcade-score small { font-size: 12px; font-weight: 400; }
.link-board { position: relative; padding: 16px; border: 1px solid #365453; border-radius: 18px; background: #132723; user-select: none; }
.link-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); }
.link-slot { min-width: 0; aspect-ratio: 1; padding: 2px; }
.link-tile { display: grid; place-items: center; width: 100%; height: 100%; overflow: hidden; border: 2px solid #b1bfa1; border-radius: 7px; background: #fff; cursor: pointer; touch-action: manipulation; transition: border-color .15s, opacity .15s; }
.link-tile img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
.link-tile.selected { border-color: #22d3ee; box-shadow: 0 0 0 1px #22d3ee; }
.link-tile.hinted { border-color: #fcd34d; box-shadow: 0 0 0 2px #fcd34d; }
.link-tile.rejected { border-color: #f87171; }
.link-tile.removing { opacity: .4; border-color: #22d3ee; }
.link-tile:focus-visible { outline: 2px solid #22d3ee; outline-offset: 1px; }
.link-line { position: absolute; left: 16px; top: 16px; width: calc(100% - 32px); height: calc(100% - 32px); overflow: visible; pointer-events: none; }
.link-help { position: relative; }
.link-help[open] > summary { margin-bottom: 0; }
.link-help .arcade-note { position: absolute; z-index: 10; right: 0; top: 52px; width: min(280px, 75vw); background: #14242a; }
.link-help p { font-size: 14px; }
.arcade-actions > button svg { width: 24px; height: 24px; }
@media (max-width: 400px) { .arcade-title { font-size: 26px; } .arcade-header { gap: 12px; } .link-board { padding: 12px; } .link-line { left: 12px; top: 12px; width: calc(100% - 24px); height: calc(100% - 24px); } }
@media (max-width: 360px) { .link-board { padding: 8px; } .link-slot { padding: 0; } .link-line { left: 8px; top: 8px; width: calc(100% - 16px); height: calc(100% - 16px); } }
</style>
