<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { techs, civics, eras, items, type Research } from "./catalog";
import { researchAvailable, researchCost, totals, speedMultiplier } from "./world";
import type { State } from "./model";
import CivIcon from "./CivIcon.vue";
import CivHelp from "./CivHelp.vue";
const props = defineProps<{ state: State; civic: boolean }>(),
  emit = defineEmits<{ choose: [string] }>();
const search = ref(""),
  listMode = ref(false),
  inspected = ref("");
const constructible = new Set(items.map(item=>item.sourceId).filter(Boolean));
const rows = computed(() => (props.civic ? civics : techs)),
  n = computed(() => props.state.nations[0]),
  done = computed(() => (props.civic ? n.value.civic : n.value.tech)),
  current = computed(() => (props.civic ? n.value.culture : n.value.research));
const positions = computed(() => {
  const counts: Record<number, number> = {},
    map: Record<string, { x: number; y: number }> = {};
  for (const r of rows.value) {
    const row = counts[r.column] ?? 0;
    counts[r.column] = row + 1;
    map[r.id] = { x: 18 + r.column * 236, y: 56 + row * 154 };
  }
  return map;
});
const width = computed(
    () => Math.max(...rows.value.map((r) => r.column)) * 236 + 250,
  ),
  height = computed(
    () => Math.max(...Object.values(positions.value).map((p) => p.y)) + 146,
  );
const selected = computed(() =>
    rows.value.find((r) => r.id === (inspected.value || current.value)),
  ),
  yieldRate = computed(
    () => totals(props.state)[props.civic ? "culture" : "science"],
  );
const matching = (t: Research) =>
  !search.value ||
  [t.name, t.effect, t.boost].some((s) => s.includes(search.value));
const progress = (t: Research) =>
  Math.min(
    100,
    ((n.value.researchProgress[t.id] ?? 0) /
      researchCost(props.state, n.value, t)) *
      100,
  );
function inspect(t: Research) {
  inspected.value = t.id;
}
watch(
  () => props.civic,
  () => {
    inspected.value = "";
    search.value = "";
  },
);
</script>
<template>
  <section class="research-view">
    <div class="section-head">
      <div>
        <div class="research-title"><h2>{{ civic ? "市政树" : "科技树" }}</h2><CivHelp label="研究规则" :text="`切换项目保留已投入进度。尤里卡 / 鼓舞减少 ${n.civ === 'china' ? 50 : 40}% 需求；部分提升条件尚未实现。解锁列表按百科列出，标注「尚未实现」的内容暂不可用。`" /></div>
        <p>每回合 +{{ yieldRate.toFixed(1) }} {{ civic ? '文化' : '科技' }}</p>
      </div>
      <label class="search"
        ><CivIcon name="compass" :size="16" /><input
          v-model="search"
          :aria-label="civic ? '搜索市政' : '搜索科技'"
          placeholder="搜索名称或解锁内容"
      /></label>
    </div>
    <div class="research-summary" v-if="selected">
      <CivIcon :name="civic ? 'culture' : 'science'" :size="28" />
      <div>
        <strong
          >{{ selected.name }}
          <span v-if="done.includes(selected.id)">已完成</span></strong
        >
        <CivHelp label="研究效果与提升" :text="`${selected.effect}\n${selected.boost || '无提升条件'}${n.boosts.includes(selected.id) ? '（已触发）' : ''}`" />
        <small
          >{{
            selected.requires.length
              ? "前置：" +
                selected.requires
                  .map((id) => rows.find((r) => r.id === id)?.name)
                  .join("、")
              : "无需前置"
          }}
          ·
          {{
            Math.ceil(
              selected.cost * speedMultiplier(state),
            )
          }}
          基础{{ civic ? "文化" : "科技" }}</small
        >
      </div>
      <a v-if="selected?.source" :href="selected.source" target="_blank" rel="noopener noreferrer">百科原条目</a>
      <button
        :disabled="!researchAvailable(n, selected.id, civic)"
        @click="emit('choose', selected.id)"
      >
        {{
          selected.id === current
            ? "研究中"
            : done.includes(selected.id)
              ? "已掌握"
              : "开始研究"
        }}
      </button>
    </div>
    <details v-if="selected?.unlocks?.length" class="unlock-details">
      <summary>解锁 {{ selected.unlocks.length }} 项 · {{ selected.unlocks.filter(u=>constructible.has(u.id)).length }} 项可建设</summary>
      <ul>
        <li v-for="unlock in selected.unlocks" :key="unlock.id">
          <a :href="unlock.source" target="_blank" rel="noopener noreferrer">{{ unlock.name }}</a>
          <span>{{ constructible.has(unlock.id) ? '已可建设' : '尚未实现' }}</span>
        </li>
      </ul>
    </details>
    <div class="tree-tools">
      <div>
        <span class="legend known">已完成</span
        ><span class="legend studying">研究中</span
        ><span class="legend unlocked">可研究</span
        ><span class="legend locked">未解锁</span>
      </div>
      <button @click="listMode = !listMode" :aria-pressed="listMode">
        {{ listMode ? "连线视图" : "列表视图" }}
      </button>
    </div>
    <div v-if="!listMode" class="tree-scroll">
      <div
        class="tree-canvas"
        :style="{ width: width + 'px', height: height + 'px' }"
      >
        <div
          v-for="column in [...new Set(rows.map((r) => r.column))]"
          :key="column"
          class="era-column"
          :style="{ left: 18 + column * 236 + 'px', height: height + 'px' }"
        >
          <span>{{ eras[rows.find((r) => r.column === column)!.era] }}</span>
        </div>
        <svg
          class="connections"
          :width="width"
          :height="height"
          aria-hidden="true"
        >
          <template v-for="t in rows" :key="t.id">
            <path
              v-for="pre in t.requires"
              :key="pre"
              :d="`M${positions[pre].x + 214} ${positions[pre].y + 66} C${positions[pre].x + 224} ${positions[pre].y + 66},${positions[t.id].x - 12} ${positions[t.id].y + 66},${positions[t.id].x} ${positions[t.id].y + 66}`"
              fill="none"
              :stroke="done.includes(pre) ? '#b9a86d' : '#4e6258'"
              stroke-width="2"
            />
          </template>
        </svg>
        <button
          v-for="t in rows"
          :key="t.id"
          class="research-node"
          :class="{
            known: done.includes(t.id),
            studying: current === t.id,
            unlocked: researchAvailable(n, t.id, civic),
            dim: !matching(t),
            inspected: selected?.id === t.id,
          }"
          :style="{
            left: positions[t.id].x + 'px',
            top: positions[t.id].y + 'px',
          }"
          @click="inspect(t)"
        >
          <div>
            <CivIcon
              :name="civic ? 'culture' : 'science'"
              :size="18"
            /><strong>{{ t.name }}</strong
            ><CivIcon v-if="done.includes(t.id)" name="check" :size="16" />
          </div>
          <p>{{ t.effect }}</p>
          <div class="node-progress">
            <i :style="{ width: progress(t) + '%' }" />
          </div>
          <small
            >{{ Math.floor(n.researchProgress[t.id] ?? 0) }} /
            {{ researchCost(state, n, t) }}
            <span v-if="current === t.id"
              >·
              {{
                Math.max(
                  1,
                  Math.ceil(
                    (researchCost(state, n, t) -
                      (n.researchProgress[t.id] ?? 0)) /
                      yieldRate,
                  ),
                )
              }}
              回合</span
            ></small
          ><small :class="{ boosted: n.boosts.includes(t.id) }"
            >{{ n.boosts.includes(t.id) ? "✓ 已触发" : "○" }}
            {{ t.boost || '无提升条件' }}</small
          >
        </button>
      </div>
    </div>
    <div v-else class="research-list">
      <button
        v-for="t in rows.filter(matching)"
        :key="t.id"
        :class="{ known: done.includes(t.id), studying: current === t.id }"
        @click="inspect(t)"
      >
        <strong
          >{{ t.name }}<span>{{ eras[t.era] }}</span></strong
        >
        <p>{{ t.effect }}</p>
        <small>{{
          done.includes(t.id)
            ? "已完成"
            : researchAvailable(n, t.id, civic)
              ? "可研究"
              : "需要 " +
                t.requires
                  .filter((id) => !done.includes(id))
                  .map((id) => rows.find((r) => r.id === id)?.name)
                  .join("、")
        }}</small>
        <div class="node-progress">
          <i :style="{ width: progress(t) + '%' }" />
        </div>
      </button>
    </div>
  </section>
</template>
<style scoped>
.unlock-details { margin-block: 8px; padding: 0 10px; border: 1px solid #53645a; border-radius: 8px; }
.unlock-details summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; }
.unlock-details ul { margin: 8px 0; padding-left: 20px; }
.unlock-details li { padding: 8px 0; }
.unlock-details a { color: #d7c893; }
.unlock-details span { color: #b5c0b6; margin-left: 12px; font-size: 13px; }
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.research-title {display:flex;align-items:center;gap:6px;}
.kicker {
  font-size: 10px;
  letter-spacing: 3px;
  color: #c4b77e;
  margin: 0 0 5px;
}
.section-head h2 {
  font-size: 25px;
  margin: 0;
  color: #efe1b2;
  font-family: serif;
}
.section-head p:not(.kicker) {
  margin: 8px 0 0;
  font-size: 12px;
  color: #bbc6b6;
}
.search {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #56685b;
  padding: 10px 12px;
  border-radius: 8px;
  color: #c4d3bd;
  background: #1c302c;
}
.search input {
  background: none;
  border: 0;
  min-width: 0;
  color: #e8ecd8;
  font-size: 14px;
  outline: none;
  width: 180px;
}
.search:focus-within {
  outline: 2px solid #e5c77f;
}
.research-summary {
  background: #2a4037;
  border: 1px solid #877b51;
  border-radius: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  color: #e7d4a0;
}
.research-summary > div {
  flex: 1;
}
.research-summary strong {
  font-size: 18px;
}
.research-summary > div > .civ-help-button {vertical-align:middle;}
.research-summary small {display:block;}
.research-summary p {
  margin: 5px 0;
  color: #d6ddca;
  font-size: 13px;
}
.research-summary small {
  color: #b7c5ac;
  font-size: 11px;
}
.research-summary button:not(.civ-help-button),
.tree-tools button {
  min-height: 44px;
  padding: 8px 12px;
  background: #394e3d;
  color: #f2e5bc;
  border: 1px solid #8a8b60;
  border-radius: 6px;
  cursor: pointer;
}
.research-summary button:not(.civ-help-button):disabled {
  color: #b3c1ac;
  background: #23382f;
  border-color: #475d4e;
  cursor: default;
}
.tree-tools {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin: 8px 0;
  align-items: center;
}
.tree-tools > div {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.legend {
  font-size: 10px;
  color: #c8cfb6;
}
.legend:before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 5px;
  border-radius: 2px;
  background: #536253;
}
.legend.known:before {
  background: #6f9d75;
}
.legend.studying:before {
  background: #dec682;
}
.legend.unlocked:before {
  background: #6ea1a1;
}
.tree-scroll {
  overflow: auto;
  max-height: 650px;
  border: 1px solid #4a6355;
  border-radius: 10px;
  background: #1c302d;
  scrollbar-width: thin;
  scrollbar-color: #627865 #1c302d;
}
.tree-canvas {
  position: relative;
}
.era-column {
  position: absolute;
  top: 0;
  width: 230px;
  border-right: 1px solid #314a3f;
  pointer-events: none;
}
.era-column > span {
  position: absolute;
  top: 18px;
  left: 3px;
  font-size: 12px;
  letter-spacing: 3px;
  color: #a9b797;
}
.connections {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
.research-node {
  display: block;
  position: absolute;
  width: 214px;
  height: 134px;
  border: 1px solid #576b5d;
  background: #263c33;
  border-radius: 8px;
  color: #cfdbc0;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.research-node > div:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
}
.research-node strong {
  flex: 1;
  min-width: 0;
  font-size: 14px;
}
.research-node p {
  font-size: 11px;
  margin: 9px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.research-node small {
  display: block;
  font-size: 10px;
  line-height: 1.8;
  color: #b0c0aa;
}
.research-node.known,
.research-list .known {
  background: #31513d;
  border-color: #7c9c6a;
}
.research-node.unlocked {
  border-color: #698d7e;
}
.research-node.studying,
.research-list .studying {
  border-color: #e5c986;
  background: #4a5136;
}
.research-node.inspected {
  box-shadow: 0 0 0 2px #e5cb8b66;
}
.research-node.dim {
  opacity: 0.35;
}
.research-node:hover {
  background: #3a5140;
}
.boosted {
  color: #e6cf8d !important;
}
.node-progress {
  height: 3px;
  border-radius: 2px;
  background: #172c26;
  margin: 8px 0 3px;
  overflow: hidden;
}
.node-progress i {
  display: block;
  height: 100%;
  background: #d0c586;
}
.research-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.research-list button {
  display: block;
  min-width: 0;
  border: 1px solid #60725d;
  background: #2a4035;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  padding: 16px;
  color: #e0e9cc;
  min-height: 118px;
}
.research-list strong {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}
.research-list strong span,
.research-list small {
  font-size: 11px;
  color: #bfccb2;
}
.research-list p {
  font-size: 12px;
  margin: 10px 0;
}
.tree-note {
  font-size: 12px;
  color: #b3c4ad;
  line-height: 1.7;
  margin-top: 14px;
}
button:focus-visible {
  outline: 2px solid #fff1bc;
  outline-offset: 2px;
}
@media (max-width: 650px) {
  .section-head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .search input {
    width: 100%;
    font-size: 16px;
  }
  .research-summary {
    gap: 10px;
    padding: 12px;
    flex-wrap: wrap;
  }
  .research-summary > svg {
    display: none;
  }
  .research-summary button:not(.civ-help-button) {
    width: 100%;
  }
  .research-list {
    grid-template-columns: 1fr;
  }
  .tree-scroll {
    max-height: 60vh;
  }
  .tree-tools {
    align-items: flex-start;
  }
  .tree-tools > div {
    max-width: 180px;
    gap: 8px;
  }
}
</style>
