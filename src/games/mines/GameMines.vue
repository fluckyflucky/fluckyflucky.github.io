<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import {
  modes,
  fresh,
  reveal,
  chord,
  hint,
  validMine,
  generateBoard,
  type Mode,
} from "./logic";
import { readSaved, saveLocal } from "../shared/storage";
import "../shared/game-ui.css";
import "../shared/puzzle-ui.css";
const key = "aoinatsu:mines:v2",
  saved = readSaved(key),
  state = ref(validMine(saved) ? saved : fresh()),
  flagMode = ref(false),
  message = ref("第一下不会踩雷。"),
  size = ref(27),
  confirm = ref<Mode | null>(null),
  suggested = ref(-1),
  scroll = ref<HTMLDivElement | null>(null);
const focused = ref(0);
let holdTimer: number | undefined;
let gesture: { x: number; y: number; cell: number; cancelled: boolean } | null = null;
let suppressClick = false;
function cancelHold() {
  window.clearTimeout(holdTimer);
  holdTimer = undefined;
}
function pointerStart(event: PointerEvent, i: number) {
  suppressClick = false;
  if (event.pointerType === 'mouse' || ended.value) return;
  cancelHold();
  suppressClick = false;
  gesture = { x: event.clientX, y: event.clientY, cell: i, cancelled: false };
  holdTimer = window.setTimeout(() => {
    if (!gesture || gesture.cancelled) return;
    suppressClick = true;
    flag(i);
    message.value = state.value.flags[i] ? '已标旗。' : '已取消标旗。';
  }, 450);
}
function pointerMove(event: PointerEvent) {
  if (!gesture) return;
  if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) {
    gesture.cancelled = true;
    suppressClick = true;
    cancelHold();
  }
}
function pointerEnd() { cancelHold(); gesture = null; }
function pointerCancel() { suppressClick = true; pointerEnd(); }
function contextFlag(i: number) {
  cancelHold();
  if (!suppressClick) flag(i);
}
function clickCell(i: number) {
  if (suppressClick) { suppressClick = false; return; }
  focused.value = i;
  open(i);
}
function keyboard(event: KeyboardEvent, i: number) {
  const w = config.value.width, row = Math.floor(i / w), col = i % w;
  let next = i;
  if (event.key === 'ArrowLeft') next = row * w + Math.max(0, col - 1);
  else if (event.key === 'ArrowRight') next = row * w + Math.min(w - 1, col + 1);
  else if (event.key === 'ArrowUp') next = Math.max(0, row - 1) * w + col;
  else if (event.key === 'ArrowDown') next = Math.min(config.value.height - 1, row + 1) * w + col;
  else if (event.key.toLowerCase() === 'f') { event.preventDefault(); flag(i); return; }
  else return;
  event.preventDefault();
  focused.value = next;
  const cell = scroll.value?.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`);
  cell?.focus({ preventScroll: true });
  cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
const config = computed(() => modes[state.value.mode]),
  flags = computed(() => state.value.flags.filter(Boolean).length),
  ended = computed(
    () => state.value.status === "won" || state.value.status === "lost",
  ),
  remaining = computed(
    () =>
      config.value.width * config.value.height -
      config.value.mines -
      state.value.opened.filter(Boolean).length,
  );
function persist() {
  saveLocal(key, state.value);
}
watch(state, persist, { deep: true });
persist();
const timer = window.setInterval(() => {
  if (
    state.value.status === "playing" &&
    document.visibilityState === "visible"
  )
    state.value.seconds++;
}, 1000);
onUnmounted(() => {
  window.clearInterval(timer);
  cancelHold();
});
function reset(mode: Mode) {
  pointerEnd();
  suppressClick = false;
  focused.value = 0;
  state.value = fresh(mode);
  confirm.value = null;
  suggested.value = -1;
  message.value = "第一下不会踩雷。";
  scroll.value?.scrollTo(0, 0);
}
function flag(i: number) {
  if (ended.value || state.value.opened[i]) return;
  state.value.flags[i] = 1 - state.value.flags[i];
  suggested.value = -1;
}
function open(i: number) {
  if (ended.value) return;
  suggested.value = -1;
  if (flagMode.value && !state.value.opened[i]) {
    flag(i);
    return;
  }
  if (state.value.flags[i]) return;
  if (!state.value.board) {
    state.value.board = generateBoard(state.value.mode, i);
    state.value.first = i;
    state.value.status = "playing";
  }
  if (state.value.opened[i]) chord(state.value, i);
  else reveal(state.value, i);
  message.value =
    state.value.status === "lost"
      ? "踩到雷了。可以重开一盘。"
      : state.value.status === "won"
        ? "扫干净了！"
        : "继续。";
}
function showHint() {
  const step = hint(state.value);
  if (!step) {
    message.value =
      state.value.status === "ready"
        ? "先点一个格子。"
        : "没找到确定的一步，这里可能需要猜。";
    return;
  }
  suggested.value = step.cell;
  message.value = step.mine
    ? "亮起的格子一定是雷，可以标旗。"
    : "亮起的格子能由数字推出安全，可以打开。";
  const row = Math.floor(step.cell / config.value.width),
    col = step.cell % config.value.width;
  scroll.value?.querySelector(`[data-cell="${row * config.value.width + col}"]`)?.scrollIntoView({
    block: 'nearest', inline: 'nearest',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}
function label(i: number) {
  return `第 ${Math.floor(i / config.value.width) + 1} 行第 ${(i % config.value.width) + 1} 列，${state.value.flags[i] ? "已标旗" : state.value.opened[i] ? (state.value.board?.[i] === 0 ? "空地" : "周围 " + state.value.board?.[i] + " 个雷") : "未打开"}`;
}
</script>
<template>
  <section class="arcade puzzle mines">
    <header class="arcade-header">
      <h1 class="arcade-title">扫雷</h1>
      <div class="arcade-stats">
        <div class="arcade-score">
          <span>剩余雷</span><strong>{{ config.mines - flags }}</strong>
        </div>
        <div class="arcade-score">
          <span>用时</span><strong>{{ state.seconds }}s</strong>
        </div>
      </div>
    </header>
    <div class="arcade-toolbar">
      <div class="arcade-actions">
        <button
          v-for="(m, k) in modes"
          :key="k"
          class="arcade-button"
          :class="{ primary: state.mode === k }"
          :aria-pressed="state.mode === k"
          @click="k !== state.mode && (state.status === 'ready' ? reset(k as Mode) : confirm = k as Mode)"
        >
          {{ m.label }}
        </button>
      </div>
      <button class="arcade-button" @click="confirm = state.mode">重开</button>
    </div>
    <div v-if="confirm" class="confirm">
      <p>重开会覆盖当前棋盘。</p>
      <button class="arcade-button" @click="reset(confirm!)">确认</button
      ><button class="arcade-button" @click="confirm = null">取消</button>
    </div>
    <div class="arcade-actions mine-tools">
      <button
        class="arcade-button"
        :class="{ primary: flagMode }"
        :aria-pressed="flagMode"
        @click="flagMode = !flagMode"
      >
        {{ flagMode ? "⚑ 标旗模式" : "▧ 开格模式" }}</button
      ><button class="arcade-button" :disabled="ended" @click="showHint">
        提示</button
      ><label
        >格子大小
        <input
          v-model.number="size"
          type="range"
          min="24"
          max="36"
          step="3" /></label
      ><span
        >{{ config.width }} × {{ config.height }} · 还剩
        {{ remaining }} 个安全格</span
      >
    </div>
    <p v-if="state.mode === 'large'" class="pan-note">手机横滑棋盘，往下看直接滚动页面。</p>
    <div ref="scroll" class="mine-scroll" @pointermove="pointerMove" @pointerup="pointerEnd" @pointercancel="pointerCancel" @scroll="cancelHold">
      <div
        class="mine-board"
        role="group"
        aria-label="扫雷棋盘"
        :style="{
          gridTemplateColumns: `repeat(${config.width},${size}px)`,
          width: `${config.width * size}px`,
        }"
      >
        <button
          v-for="(_, i) in state.opened"
          :key="i"
          class="cell"
          :class="{
            open: state.opened[i],
            flagged: state.flags[i],
            suggested: suggested === i,
            hit: state.hit === i,
          }"
          :style="{ height: `${size}px` }"
          :data-cell="i"
          :tabindex="focused === i ? 0 : -1"
          :aria-label="label(i)"
          :disabled="ended"
          @pointerdown="pointerStart($event, i)"
          @keydown="keyboard($event, i)"
          @focus="focused = i"
          @click="clickCell(i)"
          @contextmenu.prevent="contextFlag(i)"
        >
          <span v-if="state.status === 'lost' && state.board?.[i] === -1"
            >✹</span
          ><span v-else-if="state.flags[i]">⚑</span
          ><span
            v-else-if="state.opened[i] && state.board?.[i]"
            :class="`number n${state.board[i]}`"
            >{{ state.board[i] }}</span
          ><span
            v-if="
              state.status === 'lost' &&
              state.flags[i] &&
              state.board?.[i] !== -1
            "
            class="wrong"
            >×</span
          >
        </button>
      </div>
    </div>
    <p class="arcade-status" role="status">
      {{ state.status === "won" ? "扫干净了！" : message }}
    </p>
    <div class="arcade-note">
      <p>
        点击开格，右键或长按标旗，也可切换标旗模式。点数字可连开邻格，标错旗会踩雷。
      </p>
      <p>第一下不会踩雷。方向键移动，Enter 开格，F 标旗。</p>
      <p class="arcade-save-note">棋盘和计时保存在这个浏览器。</p>
    </div>
  </section>
</template>
<style scoped>
.mine-tools {
  flex-wrap: wrap;
  align-items: center;
  margin: 12px 0;
  gap: 8px;
}
.mine-tools label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #acbcad;
}
.mine-tools input {
  width: 100px;
  min-height: 44px;
}
.mine-tools > span {
  font-size: 12px;
  color: #afbdad;
}
.mine-scroll {
  overflow-x: auto;
  width: max-content;
  max-width: 100%;
  border: 3px solid #58746b;
  border-radius: 8px;
  background: #d3dfd2;
  touch-action: pan-x pan-y;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: #58746b #d3dfd2;
}
.pan-note { margin: 8px 0; font-size: 13px; color: #afbdad; }
.mine-board {
  display: grid;
  gap: 0;
}
.cell {
  position: relative;
  border: 0;
  border-right: 1px solid #7c9384;
  border-bottom: 1px solid #7c9384;
  background: linear-gradient(135deg, #e4ebd9, #afc3ae);
  box-shadow:
    inset 2px 2px #f9fff180,
    inset -2px -2px #5a7c6b55;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  color: #20392e;
  padding: 0;
  touch-action: manipulation;
  -webkit-touch-callout: none;
}
.cell.open {
  background: #ecf0e4;
  box-shadow: none;
  border-color: #c1cdbb;
  cursor: default;
}
.cell.flagged {
  color: #b13f34;
}
.cell.hit {
  background: #c96155;
  color: #fff;
}
.cell.suggested {
  outline: 3px solid #1a8caa;
  outline-offset: -4px;
  background: #a2d5c6;
}
.cell:focus-visible {
  outline: 3px solid #137d9b;
  outline-offset: -3px;
}
.cell:disabled {
  opacity: 1;
}
.number.n1 {
  color: #2166b2;
}
.number.n2 {
  color: #227537;
}
.number.n3 {
  color: #b5362e;
}
.number.n4 {
  color: #60378e;
}
.number.n5 {
  color: #894328;
}
.number.n6 {
  color: #166c6f;
}
.number.n7 {
  color: #222;
}
.number.n8 {
  color: #666;
}
.wrong {
  position: absolute;
  color: #ac2525;
  font-size: 28px;
}
.confirm {
  margin: 12px 0;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.confirm p {
  color: #b9c4b3;
}
@media (max-width: 480px) {
  .arcade-header {
    flex-wrap: wrap;
  }
}
</style>
