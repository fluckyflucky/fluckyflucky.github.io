<script setup lang="ts">
import { computed, ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue'
import { holes, levels, validState } from './logic'
import { ScrewWorld, validPhysicsSave, type ScrewPhysicsSave } from './physics'
import { readSaved, saveLocal } from '../shared/storage'
import { readProgress } from '../shared/puzzleProgress'
import '../shared/game-ui.css'
import '../shared/puzzle-ui.css'

const key = 'aoinatsu:screws:v2'
const physicsSave = readSaved(key)
const saved = readProgress(physicsSave ?? readSaved('aoinatsu:screws:v1'), levels.length, 10)
const level = ref(saved?.level ?? 0), unlocked = ref(saved?.unlocked ?? 0)
const best = ref(physicsSave && saved ? saved.best : Array<number>(levels.length).fill(0))
const puzzle = computed(() => levels[level.value])
const resumable = ref(!!saved && (validPhysicsSave(puzzle.value, saved.state) || validState(puzzle.value, saved.state)) && saved.state.moves > 0)
let world = new ScrewWorld(puzzle.value)
const state = ref({ screws: [...world.screws], moves: world.moves })
const views = shallowRef(world.views)
const accessibleHoles = ref(holes.map((_, h) => world.accessible(h)))
const remaining = ref(world.remaining)
const selected = ref<number | null>(null), suggested = ref<[number, number] | null>(null)
const history = ref<ScrewPhysicsSave[]>([]), message = ref('点一颗螺丝，再点空孔。')
const won = computed(() => remaining.value === 0)
function persist() { if (!resumable.value) saveLocal(key, { level: level.value, unlocked: unlocked.value, best: best.value, state: world.snapshot() }) }
watch([level, unlocked, best], persist, { deep: true })
watch(won, value => {
  if (!value) return
  selected.value = null
  unlocked.value = Math.max(unlocked.value, Math.min(levels.length - 1, level.value + 1))
  best.value[level.value] = best.value[level.value] ? Math.min(best.value[level.value], state.value.moves) : state.value.moves
}, { immediate: true })
function select(index: number) {
  if (index < 0 || index > unlocked.value) return
  resumable.value = false
  level.value = index; world.destroy(); world = new ScrewWorld(puzzle.value); sync(); history.value = []; selected.value = null; suggested.value = null
  message.value = '点一颗螺丝，再点空孔。'
  persist(); animate()
}
function resume() {
  if (!saved || !resumable.value) return
  world.destroy()
  world = new ScrewWorld(puzzle.value, validPhysicsSave(puzzle.value, saved.state) ? saved.state : undefined,
    validState(puzzle.value, saved.state) ? saved.state : undefined)
  resumable.value = false; sync(); persist(); animate()
  message.value = '已继续上次。'
}
function clickHole(hole: number) {
  if (won.value || !world.accessible(hole)) return
  suggested.value = null
  if (state.value.screws.includes(hole)) {
    selected.value = selected.value === hole ? null : hole
    message.value = selected.value === null ? '取消了。' : '把这颗螺丝移到一个空孔。'
    return
  }
  if (selected.value === null) { message.value = '先选一颗螺丝。'; return }
  const previous = world.snapshot()
  if (!world.relocate(selected.value, hole)) { message.value = '这个孔刚被木板挡住了。'; return }
  resumable.value = false
  history.value.push(previous); if (history.value.length > 100) history.value.shift()
  sync(); selected.value = null
  message.value = '螺丝挪好了。'
  persist(); animate()
}
function undo() {
  const prev = history.value.pop()
  if (prev) { world.destroy(); world = new ScrewWorld(puzzle.value, prev); sync(); persist(); animate() }
  selected.value = null; suggested.value = null; message.value = '退回一步。'
}
function showHint() {
  suggested.value = world.hint()
  message.value = suggested.value ? '把亮起的螺丝移到亮起的空孔。' : '先撤销几步，腾出木板外的空孔。'
}
function sync() {
  state.value = { screws: [...world.screws], moves: world.moves }
  views.value = world.views; remaining.value = world.remaining
  accessibleHoles.value = holes.map((_, h) => world.accessible(h))
}
let frame = 0, previousTime = 0, accumulator = 0, lastSave = 0, disposed = false
function tick(time: number) {
  frame = 0
  if (disposed || document.hidden) return
  accumulator += Math.min(50, previousTime ? time - previousTime : 1000 / 60); previousTime = time
  while (accumulator >= 1000 / 60) { world.step(); accumulator -= 1000 / 60 }
  sync()
  if (time - lastSave > 500) { persist(); lastSave = time }
  if (world.active) frame = requestAnimationFrame(tick)
  else { previousTime = 0; accumulator = 0; persist() }
}
function animate() { if (!frame && !disposed && !document.hidden) { previousTime = 0; frame = requestAnimationFrame(tick) } }
function visibility() { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; persist() } else animate() }
onMounted(() => { animate(); document.addEventListener('visibilitychange', visibility) })
onBeforeUnmount(() => { disposed = true; cancelAnimationFrame(frame); persist(); world.destroy(); document.removeEventListener('visibilitychange', visibility) })
</script>

<template>
  <section class="arcade puzzle">
    <header class="arcade-header"><h1 class="arcade-title">拧螺丝</h1><div class="arcade-stats"><div class="arcade-score"><span>关卡</span><strong>{{ level + 1 }} / {{ levels.length }}</strong></div><div class="arcade-score"><span>步数</span><strong>{{ state.moves }}</strong></div></div></header>
    <div class="arcade-layout">
      <div class="arcade-player">
        <div class="arcade-toolbar"><p>{{ puzzle.name }} · 剩 {{ remaining }} 块</p><div class="arcade-actions"><button v-if="resumable" class="arcade-button" @click="resume">继续上次</button><button class="arcade-button" :disabled="!history.length" @click="undo">撤销</button><button class="arcade-button" @click="select(level)">重玩</button></div></div>
        <div class="screw-stage" role="group" aria-label="螺丝木板">
          <svg viewBox="0 0 300 360" aria-hidden="true">
            <defs><pattern id="screw-grain" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 8 Q20 4 60 9 M0 22 Q35 28 60 20" fill="none" stroke="#735638" stroke-opacity=".12" /></pattern></defs>
            <rect width="300" height="360" rx="16" fill="#ece0c7" /><rect width="300" height="360" fill="url(#screw-grain)" />
            <circle v-for="(h, i) in holes" :key="i" :cx="h.x" :cy="h.y" r="9" fill="#574b3e" stroke="#fff7" stroke-width="3" />
            <g>
              <g v-for="v in views" :key="`${level}-${v.i}`" class="wood-plate" :data-plate="v.i">
                <g :transform="`translate(${v.x} ${v.y}) rotate(${v.angle})`">
                  <rect :x="-v.length / 2" y="-17" :width="v.length" height="38" rx="15" fill="#0003" />
                  <rect :x="-v.length / 2" y="-19" :width="v.length" height="36" rx="14" :fill="puzzle.plates[v.i].color" stroke="#fff6" stroke-width="2" />
                  <path :d="`M${-v.length / 2 + 26} -10 H${v.length / 2 - 26} M${-v.length / 2 + 30} 9 H${v.length / 2 - 25}`" stroke="#fff3" stroke-width="2" />
                </g>
                <circle v-for="(h, side) in [v.a, v.b]" :key="side" :cx="h.x" :cy="h.y" r="9" fill="#574b3e" stroke="#fff6" stroke-width="2" />
              </g>
            </g>
          </svg>
          <button v-for="(h, i) in holes" :key="i" class="hole-button" :class="{ selected: selected === i, suggested: suggested?.includes(i), empty: !state.screws.includes(i) }" :style="{ left: `${h.x / 3}%`, top: `${h.y / 3.6}%` }" :disabled="won || !accessibleHoles[i]" :aria-label="`${state.screws.includes(i) ? '螺丝' : '空孔'} ${i + 1}${!accessibleHoles[i] ? '，被木板遮住' : ''}`" :aria-pressed="selected === i" @click="clickHole(i)"><span v-if="state.screws.includes(i) && accessibleHoles[i]" class="bolt"><i /></span><span v-else-if="accessibleHoles[i]" class="empty-ring" /></button>
          <div v-if="won" class="arcade-result"><h2>{{ level === levels.length - 1 ? '全部拆完了' : '拆干净了！' }}</h2><p>{{ state.moves }} 步 · 本关最佳 {{ best[level] }} 步</p><button class="arcade-button primary" @click="select(level < levels.length - 1 ? level + 1 : 0)">{{ level < levels.length - 1 ? '下一关' : '再玩一遍' }}</button></div>
        </div>
        <p class="arcade-status" role="status">{{ won ? '过关了' : message }}</p>
      </div>
      <aside class="arcade-notes"><div class="arcade-note"><h2>玩法</h2><p>点螺丝，再点空孔。剩一颗时木板绕它摆动；全部拆掉才会下落。</p><p>等木板转开，露出下面的螺丝。木板孔和底板孔对齐时，也能重新钉住。</p><button class="arcade-button puzzle-hint" :disabled="won" @click="showHint">提示</button></div>
        <div class="puzzle-levels" aria-label="选择关卡"><button v-for="(_, i) in levels" :key="i" class="arcade-button" :class="{ primary: i === level, completed: best[i] }" :disabled="i > unlocked" :aria-label="`第 ${i + 1} 关${best[i] ? '，已通过' : ''}`" :aria-current="i === level ? 'step' : undefined" @click="select(i)">{{ i + 1 }}<span v-if="best[i]">✓</span></button></div>
        <p class="arcade-save-note">自动存档</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.screw-stage { position: relative; width: 100%; aspect-ratio: 5 / 6; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 32px #0003; background: #ece0c7; }
.screw-stage svg { display: block; width: 100%; height: 100%; }
.hole-button { position: absolute; width: 15%; aspect-ratio: 1; min-width: 44px; min-height: 44px; transform: translate(-50%, -50%); display: grid; place-items: center; border-radius: 50%; border: 0; background: transparent; cursor: pointer; touch-action: manipulation; }
.hole-button:disabled { cursor: default; }.hole-button:focus-visible { outline: 3px solid #155e75; outline-offset: -3px; }
.bolt { width: 64%; height: 64%; display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle at 32% 22%, #fff, #bcc6cd 48%, #657784 92%); box-shadow: 0 3px 4px #302c2a66, inset 0 0 0 2px #e8eef3; transition: transform 180ms; }
.bolt i { position: relative; width: 56%; height: 4px; background: #3d5262; border-radius: 2px; transform: rotate(-25deg); }.bolt i::after { content: ''; position: absolute; inset: 0; background: inherit; transform: rotate(90deg); border-radius: inherit; }
.empty-ring { width: 38%; height: 38%; border-radius: 50%; border: 2px solid transparent; }
.hole-button.selected .bolt { transform: rotate(70deg) scale(1.12); outline: 3px solid #167b8b; outline-offset: 3px; }
.hole-button.suggested .bolt, .hole-button.suggested .empty-ring { outline: 3px solid #167b8b; outline-offset: 3px; }
.hole-button.empty:not(:disabled):hover .empty-ring { border-color: #167b8b; }
</style>
