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
const key = "aoinatsu:mines:v1",
  saved = readSaved(key),
  state = ref(validMine(saved) ? saved : fresh()),
  flagMode = ref(false),
  message = ref("第一下不会踩雷。"),
  size = ref(window.matchMedia('(max-width: 767px), (pointer: coarse)').matches ? 44 : 36),
  confirm = ref<Mode | null>(null),
  suggested = ref(-1),
  scroll = ref<HTMLDivElement | null>(null);
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
});
function reset(mode: Mode) {
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
  scroll.value?.scrollTo({
    left: Math.max(0, col * size.value - 100),
    top: Math.max(0, row * size.value - 100),
    behavior: "smooth",
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
          @click="confirm = k as Mode"
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
          min="28"
          max="52"
          step="4" /></label
      ><span
        >{{ config.width }} × {{ config.height }} · 还剩
        {{ remaining }} 个安全格</span
      >
    </div>
    <div ref="scroll" class="mine-scroll">
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
          :aria-label="label(i)"
          :disabled="ended"
          @click="open(i)"
          @contextmenu.prevent="flag(i)"
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
        点击开格，右键标旗。手机先切到标旗模式。点已开的数字，周围旗数相等时会一起打开邻格；标错旗也会踩雷。
      </p>
      <p>只保证第一下不踩雷，后面可能需要猜。大地图可双向滚动、调大格子。</p>
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
  overflow: auto;
  max-height: 60vh;
  border: 3px solid #58746b;
  border-radius: 8px;
  background: #d3dfd2;
  touch-action: pan-x pan-y;
}
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
  font-size: 18px;
  color: #20392e;
  padding: 0;
  touch-action: manipulation;
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
  .mine-scroll {
    max-height: 55vh;
  }
}
</style>
