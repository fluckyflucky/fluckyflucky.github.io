<script setup lang="ts">
import { computed } from "vue";
import { improvements, resources } from "./catalog";
import type { State, Unit } from "./model";
import {
  info,
  canFound,
  found,
  improvementReason,
  improve,
  repair,
  chop,
  pillage,
  promote,
  upgrade,
  upgradeTo,
  spread,
  tradeTargets,
  tradeYield,
  establishTrade,
  active,
  combatPreview,
  strength,
  hasPolicy,
  cost,
} from "./world";
import { distance } from "./hex";
import CivIcon from "./CivIcon.vue";
const props = defineProps<{
  state: State;
  unit: Unit;
  mode: string;
  target: number | null;
  confirmedTarget: boolean;
}>();
const emit = defineEmits<{ mode: [string]; status: [string]; attack: [] }>();
const tile = computed(() => props.state.tiles[props.unit.tile]),
  d = computed(() => info(props.unit.type)),
  n = computed(() => props.state.nations[props.unit.owner]),
  preview = computed(() =>
    props.target !== null
      ? combatPreview(props.state, props.unit, props.target)
      : null,
  );
const source = computed(() =>
    props.state.cities.find(
      (c) => c.tile === props.unit.tile && c.owner === props.unit.owner,
    ),
  ),
  targets = computed(() => tradeTargets(props.state, props.unit)),
  spreadTargets = computed(() =>
    props.state.cities.filter(
      (c) => distance(props.state.tiles[c.tile], tile.value) <= 1,
    ),
  );
const upgradePrice = computed(() => {
  const id = upgradeTo(props.state, props.unit);
  return id
    ? Math.ceil(
        (cost(props.state, id) - cost(props.state, props.unit.type)) *
          2 *
          (hasPolicy(n.value, "professional") ? 0.5 : 1),
      )
    : 0;
});
function action(fn: () => boolean, success: string) {
  emit("status", fn() ? success : "当前不能执行此操作");
}
function fortify() {
  if (!active(props.state)) return;
  if (props.unit.fortified) {
    props.unit.fortified = false;
    props.unit.moves = props.unit.acted
      ? 0
      : (d.value.moves ?? 2) + (n.value.tech.includes("steam") ? 1 : 0);
  } else {
    props.unit.fortified = true;
    props.unit.moves = 0;
  }
  emit("mode", "inspect");
}
</script>
<template>
  <section class="unit-panel">
    <div class="inspector-title">
      <div class="unit-emblem"><CivIcon :name="d.icon" :size="32" /></div>
      <div>
        <small
          >等级 {{ unit.level }} ·
          {{ d.domain === "sea" ? "海上单位" : "陆地单位" }}</small
        >
        <h2>{{ d.name }}</h2>
      </div>
      <span class="movement-badge"
        >{{ unit.moves }} /
        {{ (d.moves ?? 2) + (n.tech.includes("steam") ? 1 : 0)
        }}<small>移动力</small></span
      >
    </div>
    <div class="unit-health">
      <div class="meter"><i :style="{ width: unit.hp + '%' }" /></div>
      <small
        >生命 {{ Math.round(unit.hp) }} / 100
        <span v-if="d.strength"
          >· 战斗力 {{ Math.round(strength(state, unit, 1)) }}</span
        ><span v-else-if="['builder', 'missionary'].includes(unit.type)"
          >· 使用次数 {{ unit.charges }}</span
        ></small
      >
    </div>
    <div class="unit-commands">
      <button
        :class="{ selected: mode === 'move' }"
        :disabled="!unit.moves || !active(state)"
        @click="emit('mode', mode === 'move' ? 'inspect' : 'move')"
      >
        <CivIcon name="arrow" />移动</button
      ><button
        v-if="d.strength"
        :class="{ selected: mode === 'attack' }"
        :disabled="!unit.moves || !active(state)"
        @click="emit('mode', mode === 'attack' ? 'inspect' : 'attack')"
      >
        <CivIcon name="sword" />攻击</button
      ><button
        :disabled="!active(state)"
        :class="{ selected: unit.fortified }"
        @click="fortify"
      >
        <CivIcon name="shield" />{{ unit.fortified ? "唤醒" : "驻守" }}</button
      ><button
        :disabled="!unit.moves || !active(state)"
        @click="
          unit.moves = 0;
          emit('mode', 'inspect');
        "
      >
        跳过本回合
      </button>
    </div>
    <template v-if="unit.type === 'settler'"
      ><button
        class="primary wide"
        :disabled="!canFound(state, unit)"
        @click="action(() => found(state, unit), '城市已建立')"
      >
        <CivIcon name="city" />建立城市
      </button>
      <p class="hint">
        新城与其他城市至少相隔四格。临河提供住房，山脉有利于学院和圣地。
      </p></template
    >
    <template v-if="unit.type === 'builder'"
      ><h3>改良地块 · 剩余 {{ unit.charges }} 次</h3>
      <div class="improvements">
        <button
          v-for="(d, id) in improvements"
          :key="id"
          :disabled="!!improvementReason(state, unit, id)"
          :title="improvementReason(state, unit, id)"
          @click="action(() => improve(state, unit, id), `${d.name}已建成`)"
        >
          <strong>{{ d.name }}</strong
          ><small>{{
            improvementReason(state, unit, id) || d.description
          }}</small>
        </button>
      </div>
      <div class="unit-commands">
        <button
          :disabled="!tile.pillaged || !unit.moves || !active(state)"
          @click="action(() => repair(state, unit), '地块已修复')"
        >
          修复</button
        ><button
          :disabled="
            tile.terrain !== 'forest' ||
            !n.tech.includes('mining') ||
            !unit.moves ||
            !active(state)
          "
          @click="action(() => chop(state, unit), '砍伐提供 25 生产')"
        >
          砍伐森林
        </button>
      </div></template
    >
    <template v-if="unit.type === 'trader'"
      ><h3>建立贸易路线</h3>
      <p v-if="!source" class="hint">先将商人移动至己方城市中心。</p>
      <div v-else class="trade-targets">
        <button
          v-for="c in targets"
          :key="c.id"
          :disabled="!unit.moves || !active(state)"
          @click="
            action(
              () => establishTrade(state, unit, c.id),
              `前往${c.name}的路线已建立`,
            )
          "
        >
          <strong
            >{{ c.name }}<span>{{ state.nations[c.owner].name }}</span></strong
          ><small
            >金币 +{{ tradeYield(state, source, c).gold.toFixed(1) }} · 粮食 +{{
              tradeYield(state, source, c).food
            }}
            · 生产 +{{ tradeYield(state, source, c).production }}</small
          >
        </button>
        <p v-if="!targets.length" class="hint">
          暂无可用目的地。探索其他城市，或提升贸易容量。
        </p>
      </div></template
    >
    <template v-if="unit.type === 'missionary'"
      ><h3>{{ n.religion || "尚未创立宗教" }}</h3>
      <div class="trade-targets">
        <button
          v-for="c in spreadTargets"
          :key="c.id"
          :disabled="!unit.moves || !n.religion || !active(state)"
          @click="
            action(() => spread(state, unit, c.id), `向${c.name}传播信仰`)
          "
        >
          向 {{ c.name }} 传教<small>信仰影响 +70；削弱其他宗教压力</small>
        </button>
      </div>
      <p v-if="!spreadTargets.length" class="hint">
        移动至城市中心的一格范围内。
      </p></template
    >
    <template v-if="d.strength"
      ><div class="unit-commands">
        <button
          :disabled="
            unit.xp < 3 * (unit.level + 1) || !unit.moves || !active(state)
          "
          @click="
            action(() => promote(state, unit), '晋升：战斗力 +4，恢复 50 生命')
          "
        >
          晋升 {{ unit.xp }} / {{ 3 * (unit.level + 1) }} 经验</button
        ><button
          v-if="upgradeTo(state, unit)"
          :disabled="
            !unit.moves ||
            n.gold < upgradePrice ||
            tile.owner !== unit.owner ||
            !active(state)
          "
          @click="action(() => upgrade(state, unit), '单位已升级')"
        >
          升级 {{ info(upgradeTo(state, unit)).name }} ·
          {{ upgradePrice }} 金</button
        ><button
          :disabled="
            tile.pillaged ||
            (!tile.improvement && !tile.district) ||
            tile.owner < 0 ||
            tile.owner === unit.owner ||
            !unit.moves ||
            !active(state)
          "
          @click="
            action(() => pillage(state, unit), '掠夺获得 25 金币，恢复 25 生命')
          "
        >
          掠夺
        </button>
      </div>
      <p class="hint">
        驻守提供防御加成；本回合未行动的单位可恢复生命。进攻后不能再次行动。
      </p></template
    >
    <div v-if="mode === 'attack'" class="combat-preview">
      <h3>战斗预览</h3>
      <template v-if="preview"
        ><strong
          >{{
            preview.enemy ? info(preview.enemy.type).name : preview.city?.name
          }}
          · {{ state.nations[preview.owner].name }}</strong
        >
        <div class="combat-numbers">
          <div>
            <span>造成伤害</span><strong>−{{ preview.damage }}</strong>
          </div>
          <div>
            <span>受到反击</span><strong>−{{ preview.retaliation }}</strong>
          </div>
        </div>
        <p v-if="preview.city?.walls" class="hint">
          先摧毁城墙；近战单位才能占领城市。
        </p>
        <button
          class="danger wide"
          :disabled="!confirmedTarget"
          @click="emit('attack')"
        >
          {{ confirmedTarget ? "确认攻击" : "点击目标以选定" }}
        </button></template
      >
      <p v-else class="hint">
        点击红色目标查看预计伤害，确认后攻击。必须先在外交面板宣战。
      </p>
    </div>
  </section>
</template>
