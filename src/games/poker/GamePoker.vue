<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from "vue";
import {
  createTable,
  validPoker,
  action,
  botAction,
  deal,
  pot,
  toCall,
  raiseMin,
  mayRaise,
  handName,
  is27,
} from "./logic";
import PokerCard from "./PokerCard.vue";
import { readSaved, saveLocal } from "../shared/storage";
import "../shared/game-ui.css";
import "../shared/puzzle-ui.css";
const key = "aoinatsu:poker:v1",
  saved = readSaved(key),
  state = ref(validPoker(saved) ? saved : createTable()),
  amount = ref(40),
  confirm = ref(false),
  message = ref(""),
  paused = ref(false);
const me = computed(() => state.value.players[0]),
  myTurn = computed(() => !state.value.done && state.value.actor === 0),
  call = computed(() => (myTurn.value ? toCall(state.value, 0) : 0)),
  min = computed(() =>
    Math.min(raiseMin(state.value), me.value.bet + me.value.chips),
  ),
  max = computed(() => me.value.bet + me.value.chips),
  raiseAllowed = computed(() => myTurn.value && mayRaise(state.value, 0)),
  over = computed(
    () =>
      (me.value.chips === 0 && state.value.done) ||
      (state.value.done &&
        state.value.players.filter((p) => p.chips > 0).length === 1),
  );
let timer: number | undefined;
function stop() {
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
}
function schedule() {
  stop();
  if (
    state.value.done ||
    state.value.actor <= 0 ||
    paused.value ||
    document.visibilityState === "hidden"
  )
    return;
  const actor = state.value.actor,
    hand = state.value.hand;
  timer = window.setTimeout(() => {
    timer = undefined;
    if (
      state.value.actor === actor &&
      state.value.hand === hand &&
      !state.value.done
    ) {
      botAction(state.value);
      schedule();
    }
  }, 550);
}
watch(
  () => [
    state.value.actor,
    state.value.hand,
    state.value.street,
    state.value.done,
    paused.value,
  ],
  () => {
    amount.value = min.value;
    schedule();
  },
  { immediate: true },
);
watch(state, () => saveLocal(key, state.value), { deep: true });
saveLocal(key, state.value);
function visibility() {
  schedule();
}
document.addEventListener("visibilitychange", visibility);
onUnmounted(() => {
  stop();
  document.removeEventListener("visibilitychange", visibility);
});
function play(type: "fold" | "call" | "raise", target = 0) {
  if (!myTurn.value || paused.value) return;
  message.value = action(state.value, type, target)
    ? ""
    : "加注至少需要达到最低金额；不足时可全押。";
}
function allIn() {
  if (me.value.chips <= call.value) play("call");
  else play("raise", max.value);
}
function next() {
  deal(state.value);
  message.value = "";
}
function reset() {
  stop();
  state.value = createTable();
  paused.value = false;
  confirm.value = false;
  message.value = "新桌开始。";
}
</script>
<template>
  <section class="arcade puzzle poker">
    <header class="arcade-header">
      <h1 class="arcade-title">德州扑克</h1>
      <div class="arcade-stats">
        <div class="arcade-score">
          <span>你的筹码</span><strong>{{ me.chips }}</strong>
        </div>
        <div class="arcade-score">
          <span>手数</span><strong>{{ state.hand }}</strong>
        </div>
      </div>
    </header>
    <div class="arcade-toolbar">
      <p>27 规则 · 盲注 10 / 20 · 纯虚拟筹码</p>
      <div class="arcade-actions">
        <button
          class="arcade-button"
          :aria-pressed="paused"
          @click="paused = !paused"
        >
          {{ paused ? "继续" : "暂停" }}</button
        ><button class="arcade-button" @click="confirm = !confirm">新桌</button>
      </div>
    </div>
    <div v-if="confirm" class="confirm">
      <p>新桌会重置四人的筹码和当前牌局。</p>
      <button class="arcade-button" @click="reset">确认</button
      ><button class="arcade-button" @click="confirm = false">取消</button>
    </div>
    <div class="felt">
      <div class="bots">
        <article
          v-for="(p, k) in state.players.slice(1)"
          :key="p.name"
          class="seat"
          :class="{
            acting: state.actor === k + 1 && !paused,
            folded: p.folded || !p.playing,
          }"
        >
          <div class="seat-name">
            {{ p.name }} <b v-if="state.dealer === k + 1" class="dealer">D</b>
          </div>
          <div class="hole">
            <PokerCard
              v-for="(c, j) in p.hole"
              :key="j"
              :card="state.revealed.includes(k + 1) ? c : undefined"
              :hidden="!state.revealed.includes(k + 1)"
            />
          </div>
          <strong class="stack">{{ p.chips }}</strong
          ><small>{{
            !p.playing
              ? "离桌"
              : p.folded
                ? "弃牌"
                : p.chips === 0 && !state.done
                  ? "全押"
                  : state.actor === k + 1 && !state.done
                    ? paused
                      ? "暂停"
                      : "思考中…"
                    : p.bet
                      ? `本轮 ${p.bet}`
                      : "等待"
          }}</small
          ><small
            v-if="
              state.done &&
              state.revealed.includes(k + 1) &&
              state.board.length === 5
            "
            >{{ handName([...p.hole, ...state.board]) }}</small
          >
        </article>
      </div>
      <div class="table-center">
        <span class="street">{{
          state.done
            ? "本手结束"
            : ["翻牌前", "翻牌", "转牌", "河牌"][state.street]
        }}</span>
        <p class="pot">
          底池 <strong>{{ pot(state) }}</strong>
        </p>
        <div class="community">
          <PokerCard v-for="i in 5" :key="i" :card="state.board[i - 1]" />
        </div>
        <p class="result" role="status">
          {{
            state.done
              ? state.result
              : paused
                ? "已暂停"
                : myTurn
                  ? "轮到你了"
                  : `${state.players[state.actor]?.name ?? "机器人"}思考中…`
          }}
        </p>
      </div>
      <article class="my-seat" :class="{ acting: myTurn && !paused }">
        <div class="hole">
          <PokerCard v-for="(c, i) in me.hole" :key="i" :card="c" />
        </div>
        <div>
          <strong>你 <b v-if="state.dealer === 0" class="dealer">D</b></strong>
          <p>
            {{
              me.folded
                ? "已弃牌"
                : me.chips === 0 && !state.done
                  ? "已全押"
                  : `本轮下注 ${me.bet}`
            }}
          </p>
          <small v-if="state.board.length >= 3">{{
            handName([...me.hole, ...state.board])
          }}</small
          ><small v-if="is27(me.hole)" class="seven"
            >2–7 不同花 · 赢主池可收奖金</small
          >
        </div>
      </article>
    </div>
    <div v-if="!state.done" class="betting">
      <div class="arcade-actions">
        <button
          class="arcade-button"
          :disabled="!myTurn || paused"
          @click="play('fold')"
        >
          弃牌</button
        ><button
          class="arcade-button primary"
          :disabled="!myTurn || paused"
          @click="play('call')"
        >
          {{ call ? `跟注 ${Math.min(call, me.chips)}` : "过牌" }}</button
        ><button
          class="arcade-button"
          :disabled="
            !myTurn ||
            paused ||
            me.chips === 0 ||
            (me.chips > call && !raiseAllowed)
          "
          @click="allIn"
        >
          全押 {{ me.chips }}
        </button>
      </div>
      <div class="raise">
        <label
          >加注到
          <input
            v-model.number="amount"
            type="number"
            inputmode="numeric"
            :min="min"
            :max="max"
            :disabled="!raiseAllowed || paused" /></label
        ><input
          v-model.number="amount"
          aria-label="加注金额"
          type="range"
          :min="min"
          :max="Math.max(min, max)"
          step="1"
          :disabled="!raiseAllowed || paused"
        /><button
          class="arcade-button"
          :disabled="!raiseAllowed || paused"
          @click="play('raise', Math.floor(amount))"
        >
          加注</button
        ><small>最低 {{ raiseMin(state) }} · 最高 {{ max }}</small>
      </div>
    </div>
    <div v-else class="next-hand">
      <p v-if="over">
        {{ me.chips === 0 ? "筹码用完了，再开一桌吧。" : "你赢下了这一桌！" }}
      </p>
      <button v-if="!over" class="arcade-button primary" @click="next">
        下一手</button
      ><button v-else class="arcade-button primary" @click="confirm = true">
        再开一桌
      </button>
    </div>
    <p v-if="message" class="arcade-status" role="status">{{ message }}</p>
    <details class="arcade-note history">
      <summary>本手记录</summary>
      <p v-for="(entry, i) in state.log" :key="i">{{ entry }}</p>
    </details>
    <div class="arcade-note rules">
      <h2>这桌的规则</h2>
      <p>
        你对三名机器人，无限注德州扑克。2、7
        不同花独赢主池，包括诈唬，每名同桌对手额外付 20
        筹码；平局不发奖金，筹码不足付剩余筹码。
      </p>
      <p>
        支持全押、边池、平分和 A2345
        顺子。机器人只看自己的底牌和公共信息，会跟注、弃牌和诈唬。
      </p>
      <p>
        仅供消遣，没有真钱、充值或提现。离开后可续打，机器人不会在后台行动。
      </p>
    </div>
  </section>
</template>
<style scoped>
.poker .arcade-header {
  flex-wrap: wrap;
}
.poker .arcade-toolbar {
  gap: 12px;
  flex-wrap: wrap;
}
.poker .arcade-toolbar p {
  font-size: 12px;
}
.felt {
  padding: 20px 16px;
  border: 6px solid #645742;
  border-radius: 28px;
  background: radial-gradient(ellipse at center, #2f6a55, #163d32 90%);
  box-shadow:
    inset 0 0 35px #0004,
    0 10px 24px #0003;
  color: #e6ebd7;
}
.bots {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.seat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 3px;
  border: 1px solid #648e7366;
  border-radius: 12px;
  background: #132c2566;
}
.seat-name {
  font-size: 14px;
}
.dealer {
  display: inline-grid;
  place-items: center;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #eadbb0;
  color: #354139;
  font-size: 11px;
  margin-left: 4px;
}
.hole,
.community {
  display: flex;
  gap: 5px;
  justify-content: center;
}
.seat small {
  font-size: 11px;
  color: #b4c7ad;
}
.seat.acting,
.my-seat.acting {
  border-color: #e6c87b;
  box-shadow: 0 0 0 1px #e6c87b;
}
.seat.folded {
  opacity: 0.45;
}
.stack {
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.table-center {
  text-align: center;
  padding: 24px 0 12px;
}
.street {
  font-size: 11px;
  color: #b9c9ad;
  letter-spacing: 3px;
}
.pot {
  margin: 8px 0 14px;
  color: #c7d8b8;
}
.pot strong {
  font-size: 23px;
  color: #f2dda3;
  margin-left: 8px;
}
.result {
  min-height: 24px;
  font-size: 13px;
  margin: 14px 0;
  color: #e4dbb4;
}
.my-seat {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 10px;
}
.my-seat p {
  margin: 3px 0;
  color: #bacdae;
  font-size: 12px;
}
.my-seat small {
  display: block;
  font-size: 12px;
}
.my-seat .seven {
  color: #f2d284;
  margin-top: 4px;
}
.betting {
  margin: 16px 0;
}
.betting > .arcade-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.raise {
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.raise label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #c5ceb8;
}
.raise input[type="number"] {
  width: 92px;
  min-height: 44px;
  padding: 8px;
  background: #23362f;
  color: #fff;
  border: 1px solid #667864;
  border-radius: 6px;
}
.raise input[type="range"] {
  min-height: 44px;
  flex: 1;
  min-width: 80px;
}
.raise small {
  width: 100%;
  color: #93a38e;
  font-size: 11px;
}
.history {
  margin: 16px 0;
}
.history summary {
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.history p {
  font-size: 12px;
}
.rules p {
  margin: 8px 0;
}
.next-hand {
  display: flex;
  justify-content: center;
  margin: 18px 0;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.next-hand p {
  color: #ddd5b8;
}
.confirm {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin: 12px 0;
  color: #ccd1b9;
}
@media (max-width: 480px) {
  .felt {
    padding: 14px 8px;
    border-width: 4px;
  }
  .bots {
    gap: 5px;
  }
  .seat-name {
    font-size: 12px;
  }
  .seat {
    padding: 8px 2px;
  }
  .hole {
    gap: 3px;
  }
  .table-center {
    padding-top: 18px;
  }
  .my-seat {
    gap: 12px;
  }
  .betting .arcade-button {
    font-size: 13px;
    padding: 8px;
  }
  .community {
    gap: 6px;
  }
}
</style>
