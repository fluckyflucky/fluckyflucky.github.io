<script setup lang="ts">
import { computed, nextTick, ref, watch, onUnmounted } from 'vue'
import { createTable, restorePoker, action, botAction, deal, pot, toCall, raiseMin, mayRaise, handName, is27,
  humanSeat, tableSettings, validSettings, botStyles, type SeatKind, type TableSettings } from './logic'
import PokerCard from './PokerCard.vue'
import GameIcon from '../shared/GameIcon.vue'
import { readSaved, saveLocal } from '../shared/storage'
import '../shared/game-ui.css'
import '../shared/puzzle-ui.css'

const key = 'aoinatsu:poker:v1'
const state = ref(restorePoker(readSaved(key)) ?? createTable())
const amount = ref(40), confirm = ref(false), message = ref(''), paused = ref(false)
const dialog = ref<HTMLDialogElement | null>(null), panel = ref<'settings' | 'help' | null>(null)
const draft = ref<TableSettings>(tableSettings(state.value)), settingsError = ref('')
const self = computed(() => humanSeat(state.value)), me = computed(() => state.value.players[self.value])
const myTurn = computed(() => !state.value.done && state.value.actor === self.value)
const call = computed(() => myTurn.value ? toCall(state.value, self.value) : 0)
const min = computed(() => Math.min(raiseMin(state.value), me.value.bet + me.value.chips))
const max = computed(() => me.value.bet + me.value.chips)
const raiseAllowed = computed(() => myTurn.value && mayRaise(state.value, self.value))
const over = computed(() => state.value.done && (me.value.chips === 0 || state.value.players.filter(p => p.chips > 0).length === 1))
const seatChanges = computed(() => draft.value.seats.some((p, i) => p.kind !== state.value.players[i].kind))
let timer: number | undefined
function stop() { if (timer !== undefined) window.clearTimeout(timer); timer = undefined }
function schedule() {
  stop()
  if (state.value.done || state.value.actor < 0 || state.value.players[state.value.actor].kind !== 'bot'
    || paused.value || panel.value || document.hidden) return
  const actor = state.value.actor, hand = state.value.hand
  timer = window.setTimeout(() => {
    timer = undefined
    if (state.value.actor === actor && state.value.hand === hand && !state.value.done
      && !paused.value && !panel.value && !document.hidden) {
      botAction(state.value); schedule()
    }
  }, 550)
}
watch(() => [state.value.actor, state.value.hand, state.value.street, state.value.done, paused.value, panel.value],
  () => { amount.value = min.value; schedule() }, { immediate: true })
watch(state, () => saveLocal(key, state.value), { deep: true })
saveLocal(key, state.value)
document.addEventListener('visibilitychange', schedule)
onUnmounted(() => { stop(); document.removeEventListener('visibilitychange', schedule) })

function play(type: 'fold' | 'call' | 'raise', target = 0) {
  if (!myTurn.value || paused.value || panel.value) return
  message.value = action(state.value, type, target) ? '' : '加注金额不够；筹码不足时可以全押。'
}
function allIn() { if (me.value.chips <= call.value) play('call'); else play('raise', max.value) }
function next() { deal(state.value); message.value = '' }
function reset() {
  stop(); state.value = createTable(tableSettings(state.value))
  paused.value = false; confirm.value = false; message.value = ''
}
async function openPanel(type: 'settings' | 'help', seat?: number) {
  stop(); panel.value = type; settingsError.value = ''
  if (type === 'settings') draft.value = tableSettings(state.value)
  await nextTick(); dialog.value?.showModal()
  if (seat !== undefined) dialog.value?.querySelector<HTMLSelectElement>(`#seat-${seat}`)?.focus()
}
function chooseSeat(i: number, event: Event) {
  const kind = (event.target as HTMLSelectElement).value as SeatKind
  if (kind === 'human') draft.value.seats.forEach((seat, k) => { if (k !== i && seat.kind === 'human') seat.kind = 'empty' })
  draft.value.seats[i].kind = kind; settingsError.value = ''
}
function applySettings() {
  if (!validSettings(draft.value)) { settingsError.value = '选一个你的位置，至少留一个机器人。'; return }
  if (seatChanges.value) { state.value = createTable(draft.value); confirm.value = false }
  else state.value.players.forEach((p, i) => { p.style = draft.value.seats[i].style })
  message.value = ''; dialog.value?.close()
}
function seatStatus(i: number) {
  const p = state.value.players[i]
  if (p.kind === 'empty') return ''
  if (!p.playing) return '筹码用完'
  if (p.folded) return '弃牌'
  if (!state.value.done && p.chips === 0) return '全押'
  if (!state.value.done && state.value.actor === i) return paused.value || panel.value ? '暂停' : p.kind === 'human' ? '轮到你' : '思考中'
  return p.bet ? `下注 ${p.bet}` : ''
}
</script>

<template>
  <section class="arcade puzzle poker">
    <header class="arcade-header">
      <h1 class="arcade-title">德州扑克</h1>
      <div class="arcade-stats">
        <div class="arcade-score"><span>你的筹码</span><strong>{{ me.chips }}</strong></div>
        <div class="arcade-score"><span>手数</span><strong>{{ state.hand }}</strong></div>
      </div>
    </header>
    <div class="arcade-toolbar">
      <p>10 / 20 · 27 规则</p>
      <div class="arcade-actions">
        <button class="arcade-button icon-button" aria-label="牌桌设置" title="牌桌设置" @click="openPanel('settings')"><GameIcon name="settings" /></button>
        <button class="arcade-button icon-button" :aria-label="paused ? '继续' : '暂停'" :title="paused ? '继续' : '暂停'" :aria-pressed="paused" @click="paused = !paused"><GameIcon :name="paused ? 'play' : 'pause'" /></button>
        <button class="arcade-button icon-button" aria-label="新桌" title="新桌" :aria-expanded="confirm" @click="confirm = !confirm"><GameIcon name="reset" /></button>
        <button class="arcade-button icon-button" aria-label="规则" title="规则" @click="openPanel('help')"><GameIcon name="help" /></button>
      </div>
    </div>
    <div v-if="confirm" class="confirm">
      <p>重开牌桌，筹码各回到 1000。</p>
      <button class="arcade-button" @click="reset">重开</button><button class="arcade-button" @click="confirm = false">取消</button>
    </div>
    <div class="felt" aria-label="六人牌桌">
      <article v-for="(p, i) in state.players" :key="i" class="seat" :class="[`seat-${i}`, {
        acting: !state.done && state.actor === i && !paused && !panel, folded: p.folded || (!p.playing && p.kind !== 'empty'), empty: p.kind === 'empty', self: p.kind === 'human' }]"
        :aria-label="`座位 ${i + 1}，${p.kind === 'empty' ? '空位' : p.name}`">
        <button class="seat-name" :aria-label="`设置座位 ${i + 1}`" :title="`设置座位 ${i + 1}`" @click="openPanel('settings', i)">
          <GameIcon :name="p.kind === 'human' ? 'person' : p.kind === 'bot' ? 'bot' : 'chair'" />
          <span>{{ p.kind === 'empty' ? '空位' : p.name }}</span><b v-if="state.dealer === i && p.playing" class="dealer">D</b>
        </button>
        <div v-if="p.kind !== 'empty'" class="hole">
          <PokerCard v-for="(c, j) in p.hole" :key="j" :card="p.kind === 'human' || state.revealed.includes(i) ? c : undefined" :hidden="p.kind !== 'human' && !state.revealed.includes(i)" />
        </div>
        <strong v-if="p.kind !== 'empty'" class="stack">{{ p.chips }}</strong>
        <small v-if="p.kind === 'bot'" class="style-name">{{ botStyles[p.style].label }}</small>
        <small class="seat-status">{{ seatStatus(i) }}</small>
      </article>
      <div class="table-center">
        <span class="street">{{ state.done ? '本手结束' : ['翻牌前', '翻牌', '转牌', '河牌'][state.street] }}</span>
        <p class="pot">底池 <strong>{{ pot(state) }}</strong></p>
        <div class="community"><PokerCard v-for="i in 5" :key="i" :card="state.board[i - 1]" /></div>
        <p class="result" role="status">{{ state.done ? state.result : paused ? '已暂停' : myTurn ? '轮到你了' : `${state.players[state.actor]?.name}思考中` }}</p>
        <small v-if="state.board.length >= 3 && !me.folded">{{ handName([...me.hole, ...state.board]) }}</small>
        <small v-if="is27(me.hole)" class="seven">2–7</small>
      </div>
    </div>
    <div v-if="!state.done" class="betting">
      <div class="arcade-actions">
        <button class="arcade-button" :disabled="!myTurn || paused" @click="play('fold')">弃牌</button>
        <button class="arcade-button primary" :disabled="!myTurn || paused" @click="play('call')">{{ call ? `跟注 ${Math.min(call, me.chips)}` : '过牌' }}</button>
        <button class="arcade-button" :disabled="!myTurn || paused || me.chips === 0 || (me.chips > call && !raiseAllowed)" @click="allIn">全押 {{ me.chips }}</button>
      </div>
      <div class="raise">
        <label>加注到<input v-model.number="amount" type="number" inputmode="numeric" :min="min" :max="max" :disabled="!raiseAllowed || paused" /></label>
        <input v-model.number="amount" aria-label="加注金额" type="range" :min="min" :max="Math.max(min, max)" step="1" :disabled="!raiseAllowed || paused" />
        <button class="arcade-button" :disabled="!raiseAllowed || paused" @click="play('raise', Math.floor(amount))">加注</button>
        <small>最低 {{ raiseMin(state) }} · 最高 {{ max }}</small>
      </div>
    </div>
    <div v-else class="next-hand">
      <p v-if="over">{{ me.chips === 0 ? '筹码用完了' : '你赢下了这一桌' }}</p>
      <button v-if="!over" class="arcade-button primary" @click="next">下一手</button>
      <button v-else class="arcade-button primary" @click="confirm = true">再开一桌</button>
    </div>
    <p v-if="message" class="arcade-status" role="status">{{ message }}</p>
    <details class="arcade-note history"><summary>本手记录</summary><p v-for="(entry, i) in state.log" :key="i">{{ entry }}</p></details>

    <dialog ref="dialog" :aria-label="panel === 'settings' ? '牌桌设置' : '规则'" @close="panel = null">
      <header class="panel-header"><h2>{{ panel === 'settings' ? '牌桌设置' : '规则' }}</h2><button class="arcade-button icon-button" aria-label="关闭" title="关闭" @click="dialog?.close()"><GameIcon name="close" /></button></header>
      <template v-if="panel === 'settings'">
        <div class="settings-seats">
          <div v-for="(seat, i) in draft.seats" :key="i" class="settings-seat">
            <span class="seat-number">{{ i + 1 }}</span>
            <div>
              <label :for="`seat-${i}`">座位 {{ i + 1 }}</label>
              <select :id="`seat-${i}`" :value="seat.kind" @change="chooseSeat(i, $event)"><option value="human">你</option><option value="bot">机器人</option><option value="empty">空位</option></select>
            </div>
            <div v-if="seat.kind === 'bot'">
              <label :for="`style-${i}`">打法</label>
              <select :id="`style-${i}`" v-model="seat.style"><option v-for="(style, value) in botStyles" :key="value" :value="value">{{ style.label }}</option></select>
            </div>
          </div>
        </div>
        <p class="settings-note">紧＝少入池，松＝多入池；凶＝多加注，弱＝多跟注。</p>
        <p v-if="seatChanges" class="settings-note">换座或增减人数会重开牌局，筹码各回到 1000。</p>
        <p v-if="settingsError" class="settings-error" role="alert">{{ settingsError }}</p>
        <footer class="panel-actions"><button class="arcade-button" @click="dialog?.close()">取消</button><button class="arcade-button primary" @click="applySettings">{{ seatChanges ? '重开并应用' : '应用风格' }}</button></footer>
      </template>
      <div v-else class="rules">
        <p>无限注德州扑克，盲注 10 / 20。庄家左侧先行动；单挑时，庄家付小盲，翻牌前先行动、翻牌后后行动。</p>
        <p>2–7 独赢主池（含诈唬，同花也算），每名本手对手额外付 10 个大盲，即 200 筹码。平局不发奖金，筹码不足付剩余筹码。</p>
        <p>筹码只供游戏，不能兑换。牌局自动保存在这台设备上。</p>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.poker .arcade-header { flex-wrap: wrap; }
.poker .arcade-toolbar { gap: 12px; flex-wrap: wrap; }
.poker .arcade-toolbar p { font-size: 13px; }
.icon-button { width: 44px; min-width: 44px; height: 44px; padding: 8px; display: inline-grid; place-items: center; }
.felt { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: auto auto auto; gap: 12px 16px; padding: 20px; border: 6px solid #645742; border-radius: 34px; background: radial-gradient(ellipse, #2f6a55, #163d32 90%); box-shadow: inset 0 0 35px #0004, 0 10px 24px #0003; color: #e6ebd7; }
.seat { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 4px; min-width: 0; border: 1px solid #648e7366; border-radius: 14px; background: #132c2566; }
.seat-0 { grid-area: 3 / 2; }.seat-1 { grid-area: 3 / 1; }.seat-2 { grid-area: 1 / 1; }.seat-3 { grid-area: 1 / 2; }.seat-4 { grid-area: 1 / 3; }.seat-5 { grid-area: 3 / 3; }
.seat-name { min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 5px; color: inherit; cursor: pointer; width: 100%; background: transparent; border: 0; border-radius: 8px; font-size: 14px; }
.seat-name:hover { background: #ffffff12; }.seat-name:focus-visible { outline: 2px solid #e6c87b; }
.seat-name svg { width: 18px; height: 18px; }
.dealer { display: inline-grid; place-items: center; min-width: 17px; height: 17px; border-radius: 50%; background: #eadbb0; color: #354139; font-size: 10px; }
.hole, .community { display: flex; gap: 5px; justify-content: center; }
.seat small { font-size: 11px; color: #c4d5bd; }.seat-status { min-height: 16px; }
.seat.acting { border-color: #e6c87b; box-shadow: 0 0 0 1px #e6c87b; }
.seat.self { background: #234837; }.seat.folded .hole { opacity: 0.4; }
.seat.empty { border-style: dashed; background: transparent; }
.stack { font-size: 17px; font-variant-numeric: tabular-nums; }
.table-center { grid-area: 2 / 1 / 3 / 4; text-align: center; padding: 12px 0; }
.street { font-size: 12px; color: #ccdac2; letter-spacing: 2px; }
.pot { margin: 6px 0 14px; color: #c7d8b8; }.pot strong { font-size: 23px; color: #f2dda3; margin-left: 8px; }
.result { min-height: 22px; font-size: 13px; margin: 12px 0 4px; color: #e4dbb4; }.seven { color: #f2d284; margin-left: 10px; }
.betting { margin: 16px 0; }.betting > .arcade-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.raise { margin: 12px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.raise label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #c5ceb8; }
.raise input[type="number"] { width: 92px; min-height: 44px; padding: 8px; font-size: 16px; background: #23362f; color: #fff; border: 1px solid #667864; border-radius: 6px; }
.raise input[type="range"] { min-height: 44px; flex: 1; min-width: 70px; }.raise small { width: 100%; color: #b4c3ac; font-size: 12px; }
.history { margin: 16px 0; }.history summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; }.history p { font-size: 13px; }
.next-hand, .confirm { display: flex; justify-content: center; margin: 16px 0; align-items: center; gap: 10px; flex-wrap: wrap; }.confirm { justify-content: flex-start; color: #ccd1b9; }
dialog { width: min(640px, calc(100% - 24px)); max-height: calc(100dvh - 32px); margin: auto; padding: 20px; border: 1px solid #677761; border-radius: 18px; background: #142b25; color: #e6ebd7; overflow-y: auto; }
dialog::backdrop { background: #07110ccc; }.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }.panel-header h2 { font-size: 20px; }
.settings-seats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.settings-seat { display: grid; grid-template-columns: 24px 1fr 1fr; align-items: center; gap: 8px; padding: 12px 8px; background: #234036; border-radius: 10px; }
.seat-number { display: grid; place-items: center; width: 24px; height: 24px; border: 1px solid #8ea382; border-radius: 50%; font-size: 13px; }
.settings-seat label { display: block; color: #ccd9c4; font-size: 12px; margin-bottom: 5px; }.settings-seat > div { min-width: 0; }
.settings-seat select { width: 100%; min-height: 44px; padding: 6px; color: #edf3e6; background: #102c23; border: 1px solid #8ca47e; border-radius: 6px; font-size: 16px; cursor: pointer; }
.settings-note, .rules p { font-size: 14px; line-height: 1.7; margin: 14px 0; color: #d0ddc7; }.settings-error { color: #ffc2af; font-size: 14px; }
.panel-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
@media (max-width: 480px) {
  .felt { padding: 12px 6px; border-width: 4px; gap: 8px 6px; }.seat { padding: 2px; }.seat-name { font-size: 12px; gap: 3px; }.seat-name svg { width: 15px; height: 15px; }
  .hole { gap: 3px; }.seat :deep(.playing-card) { width: 32px; height: 46px; padding: 3px; }.seat :deep(.playing-card b) { font-size: 15px; }.seat :deep(.playing-card > span) { font-size: 17px; }
  .table-center { padding: 8px 0; }.betting .arcade-button { font-size: 13px; padding: 8px; }.community { gap: 6px; }
  .settings-seats { grid-template-columns: 1fr; }dialog { padding: 16px; }
}
</style>
