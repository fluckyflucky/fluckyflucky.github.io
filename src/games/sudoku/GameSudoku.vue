<script setup lang="ts">
import { computed, ref, watch, onUnmounted, nextTick } from "vue";
import {
  generate,
  validSudoku,
  conflicts,
  peers,
  logicalStep,
  candidates,
} from "./logic";
import { readSaved, saveLocal } from "../shared/storage";
import GameIcon from '../shared/GameIcon.vue';
import "../shared/game-ui.css";
import "../shared/puzzle-ui.css";
const key = "aoinatsu:sudoku:v1",
  saved = readSaved(key),
  state = ref(validSudoku(saved) ? saved : generate()),
  selected = ref(0),
  pencil = ref(false),
  message = ref(""),
  confirm = ref(false);
const history = ref<{ values: number[]; notes: number[] }[]>([]),
  bad = computed(() => conflicts(state.value.values)),
  won = computed(() =>
    state.value.values.every((v, i) => v === state.value.solution[i]),
  ),
  filled = computed(() => state.value.values.filter(Boolean).length);
const boardElement = ref<HTMLElement | null>(null);
function focusSelected() {
  nextTick(() => boardElement.value?.querySelector<HTMLButtonElement>(`[data-cell="${selected.value}"]`)?.focus({ preventScroll: true }));
}
function persist() {
  saveLocal(key, state.value);
}
watch(state, persist, { deep: true });
persist();
const timer = window.setInterval(() => {
  if (!won.value && document.visibilityState === "visible") {
    state.value.seconds++;
  }
}, 1000);
onUnmounted(() => window.clearInterval(timer));
function snapshot() {
  history.value.push({
    values: [...state.value.values],
    notes: [...state.value.notes],
  });
  if (history.value.length > 80) history.value.shift();
}
function enter(v: number) {
  const i = selected.value;
  if (won.value || state.value.givens[i] || (!pencil.value && state.value.values[i] === v)) { focusSelected(); return; }
  snapshot();
  if (pencil.value && v) {
    state.value.notes[i] ^= 1 << (v - 1);
    state.value.values[i] = 0;
  } else {
    state.value.values[i] = v;
    state.value.notes[i] = 0;
    if (v) for (const j of peers[i]) state.value.notes[j] &= ~(1 << (v - 1));
  }
  message.value = won.value
    ? "填完了！"
    : bad.value.some(Boolean)
      ? "红色格子有重复数字。"
      : "";
  focusSelected();
}
function undo() {
  const a = history.value.pop();
  if (a) {
    state.value.values = a.values;
    state.value.notes = a.notes;
    message.value = "";
    focusSelected();
  }
}
function hint() {
  if (won.value) return;
  const wrong = state.value.values.findIndex(
    (v, i) => v && v !== state.value.solution[i],
  );
  if (wrong >= 0) {
    selected.value = wrong;
    message.value = "所选格子的数字不对。";
    focusSelected();
    return;
  }
  const step = logicalStep(state.value.values);
  if (step) {
    snapshot();
    selected.value = step.cell;
    state.value.values[step.cell] = step.value;
    state.value.notes[step.cell] = 0;
    for (const i of peers[step.cell])
      state.value.notes[i] &= ~(1 << (step.value - 1));
    message.value = step.reason;
    focusSelected();
  }
}
function newGame(difficulty: "easy" | "normal") {
  state.value = generate(difficulty);
  history.value = [];
  selected.value = 0;
  confirm.value = false;
  message.value = "";
}
function keydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[1-9]$/.test(e.key)) {
    e.preventDefault();
    enter(Number(e.key));
  } else if (["Backspace", "Delete", "0"].includes(e.key)) {
    e.preventDefault();
    enter(0);
  } else if (e.key === "n" || e.key === "N") {
    e.preventDefault();
    if (!e.repeat) pencil.value = !pencil.value;
  } else if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
  ) {
    e.preventDefault();
    const r = Math.floor(selected.value / 9),
      c = selected.value % 9;
    selected.value =
      e.key === "ArrowUp"
        ? Math.max(0, r - 1) * 9 + c
        : e.key === "ArrowDown"
          ? Math.min(8, r + 1) * 9 + c
          : e.key === "ArrowLeft"
            ? r * 9 + Math.max(0, c - 1)
            : r * 9 + Math.min(8, c + 1);
    focusSelected();
  }
}
</script>
<template>
  <section class="arcade puzzle sudoku">
    <header class="arcade-header">
      <h1 class="arcade-title">数独</h1>
      <div class="arcade-stats">
        <div class="arcade-score">
          <span>已填</span><strong>{{ filled }} / 81</strong>
        </div>
        <div class="arcade-score">
          <span>用时</span
          ><strong
            >{{ Math.floor(state.seconds / 60) }}:{{
              String(state.seconds % 60).padStart(2, "0")
            }}</strong
          >
        </div>
      </div>
    </header>
    <div class="arcade-layout">
      <div class="arcade-player">
        <div class="arcade-toolbar">
          <p>{{ state.difficulty === "easy" ? "轻松" : "标准" }} · 唯一解</p>
          <button class="arcade-button icon-button" aria-label="换一题" title="换一题" @click="confirm = !confirm">
            <GameIcon name="reset" />
          </button>
        </div>
        <div v-if="confirm" class="new-choice">
          <p>换题会覆盖当前进度。</p>
          <button class="arcade-button" @click="newGame('easy')">轻松</button
          ><button class="arcade-button" @click="newGame('normal')">标准</button
          ><button class="arcade-button" @click="confirm = false">取消</button>
        </div>
        <div
          ref="boardElement"
          class="sudoku-board"
          role="group"
          aria-label="数独棋盘"
          @keydown="keydown"
        >
          <button
            v-for="(v, i) in state.values"
            :key="i"
            :data-cell="i"
            :tabindex="selected === i ? 0 : -1"
            class="cell"
            :class="{
              given: state.givens[i],
              selected: selected === i,
              peer: peers[selected].includes(i),
              same: v && v === state.values[selected],
              bad: bad[i],
              right: i % 9 === 2 || i % 9 === 5,
              bottom: Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5,
            }"
            :aria-label="`第 ${Math.floor(i / 9) + 1} 行第 ${(i % 9) + 1} 列，${v || '空格'}${state.givens[i] ? '，题目数字' : ''}`"
            :aria-pressed="selected === i"
            @click="selected = i"
          >
            <span v-if="v">{{ v }}</span
            ><span v-else class="notes"
              ><i v-for="n in 9" :key="n">{{
                state.notes[i] & (1 << (n - 1)) ? n : ""
              }}</i></span
            >
          </button>
        </div>
        <div class="digits">
          <button
            v-for="n in 9"
            :key="n"
            class="arcade-button"
            :disabled="won"
            @click="enter(n)"
          >
            {{ n }}
          </button>
        </div>
        <div class="arcade-actions">
          <button
            class="arcade-button icon-button"
            :class="{ primary: pencil }"
            :aria-pressed="pencil"
            aria-label="笔记模式" title="笔记模式"
            @click="pencil = !pencil"
          >
            <GameIcon name="pencil" /></button
          ><button class="arcade-button icon-button" :disabled="won" aria-label="擦除" title="擦除" @click="enter(0)">
            <GameIcon name="eraser" /></button
          ><button
            class="arcade-button icon-button"
            :disabled="!history.length"
            aria-label="撤销" title="撤销"
            @click="undo"
          >
            <GameIcon name="undo" /></button
          ><button class="arcade-button icon-button" :disabled="won" aria-label="提示" title="提示" @click="hint">
            <GameIcon name="hint" />
          </button>
        </div>
        <p class="arcade-status" role="status">
          {{ won ? "填完了！" : message }}
        </p>
      </div>
      <aside class="arcade-notes">
        <details class="game-help">
          <summary aria-label="玩法" title="玩法"><GameIcon name="help" /></summary>
          <div class="arcade-note">
            <p>每行、每列、每个九宫都填 1–9，不重复。</p>
            <p>笔记可以记候选数字。电脑支持数字键、方向键、退格；N 切换笔记。</p>
          </div>
        </details>
        <p class="arcade-save-note">自动存档</p>
      </aside>
    </div>
  </section>
</template>
<style scoped>
.sudoku-board {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  border: 3px solid #536c63;
  border-radius: 5px;
  overflow: hidden;
  background: #e8efe7;
  aspect-ratio: 1;
}
.cell {
  padding: 0;
  min-width: 0;
  border: 0;
  border-right: 1px solid #b7c7bc;
  border-bottom: 1px solid #b7c7bc;
  color: #217c9b;
  background: #f7f9ee;
  aspect-ratio: 1;
  font-size: clamp(19px, 5vw, 29px);
  cursor: pointer;
  touch-action: manipulation;
}
.cell.given {
  color: #33453e;
  font-weight: 600;
}
.cell.peer {
  background: #e6eee2;
}
.cell.same {
  background: #d5e7d0;
}
.cell.selected {
  background: #bddbcc;
  box-shadow: inset 0 0 0 2px #328579;
}
.cell.bad {
  color: #ba3232;
  background: #f5dede;
}
.cell.right {
  border-right: 3px solid #536c63;
}
.cell.bottom {
  border-bottom: 3px solid #536c63;
}
.cell:focus-visible {
  outline: 3px solid #257d94;
  outline-offset: -3px;
}
.notes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  height: 100%;
  padding: 2px;
  color: #61796b;
}
.notes i {
  font-style: normal;
  font-size: clamp(8px, 2vw, 11px);
  display: grid;
  place-items: center;
}
.digits {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 3px;
  margin: 14px 0;
}
.digits button {
  padding: 8px 0;
  font-size: 19px;
}
.new-choice {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.new-choice p {
  width: 100%;
  color: #c5cebb;
}
.arcade-actions {
  flex-wrap: wrap;
}
@media (max-width: 380px) {
  .arcade-header {
    flex-wrap: wrap;
  }
  .cell {
    font-size: 22px;
  }
}
</style>
