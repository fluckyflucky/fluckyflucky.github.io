<script setup lang="ts">
import { rank, suit, suits, cardText } from "./logic";
defineProps<{ card?: number; hidden?: boolean }>();
</script>
<template>
  <div
    class="playing-card"
    :class="{
      back: hidden,
      empty: card === undefined && !hidden,
      red: card !== undefined && [1, 2].includes(suit(card)),
    }"
    :aria-label="
      hidden ? '背面牌' : card === undefined ? '待发牌' : cardText(card)
    "
  >
    <template v-if="!hidden && card !== undefined"
      ><b>{{
        [
          "",
          "",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "J",
          "Q",
          "K",
          "A",
        ][rank(card)]
      }}</b
      ><span>{{ suits[suit(card)] }}</span></template
    ><span v-else-if="hidden" aria-hidden="true">✦</span>
  </div>
</template>
<style scoped>
.playing-card {
  width: 46px;
  height: 65px;
  flex-shrink: 0;
  border-radius: 6px;
  background: #f3f0df;
  color: #23352e;
  border: 1px solid #e4ddc3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px;
  box-shadow: 0 3px 6px #0003;
  font-family: Georgia, serif;
}
.playing-card b {
  font-size: 20px;
  line-height: 1;
}
.playing-card > span {
  font-size: 23px;
  align-self: flex-end;
  line-height: 1;
}
.playing-card.red {
  color: #b0443f;
}
.playing-card.back {
  background: repeating-linear-gradient(45deg, #405d79 0 3px, #344d65 3px 6px);
  border: 3px solid #c9d6d2;
  align-items: center;
  justify-content: center;
}
.playing-card.back > span {
  align-self: center;
  color: #d4dcc9;
  font-size: 26px;
}
.playing-card.empty {
  background: #102e29;
  border: 1px dashed #76968855;
  box-shadow: none;
}
@media (max-width: 480px) {
  .playing-card {
    width: 38px;
    height: 54px;
    padding: 4px;
  }
  .playing-card b {
    font-size: 17px;
  }
  .playing-card > span {
    font-size: 20px;
  }
}
</style>
