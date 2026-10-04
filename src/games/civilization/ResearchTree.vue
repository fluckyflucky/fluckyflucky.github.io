<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { techs, civics, eras, type Research } from "./catalog";
import { researchPrerequisites } from './research';
import { researchGeometry, researchLayout } from './research-layout';
import { active, researchAvailable, researchCost, totals, speedMultiplier } from "./world";
import type { State } from "./model";
import CivIcon from "./CivIcon.vue";
import CivHelp from "./CivHelp.vue";
const props = defineProps<{ state: State; civic: boolean }>(),
  emit = defineEmits<{ choose: [string] }>();
const search = ref(""),
  listMode = ref(false),
  inspected = ref("");
const treeScroll = ref<HTMLElement | null>(null);
const rows = computed(() => (props.civic ? civics : techs)),
  n = computed(() => props.state.nations[0]),
  done = computed(() => (props.civic ? n.value.civic : n.value.tech)),
  current = computed(() => (props.civic ? n.value.culture : n.value.research));
const layout = computed(() => researchLayout(rows.value));
const positions = computed(() => layout.value.positions),
  width = computed(() => layout.value.width), height = computed(() => layout.value.height);
const firstChoice = computed(() => rows.value.find(r => researchAvailable(n.value, r.id, props.civic)));
const selected = computed(() =>
    rows.value.find((r) => r.id === (inspected.value || current.value)) ?? firstChoice.value,
  ),
  yieldRate = computed(
    () => totals(props.state)[props.civic ? "culture" : "science"],
  );
const linked = (from: string, to: string) => from === selected.value?.id || to === selected.value?.id;
const connections = computed(() => [...layout.value.connections].sort((a, b) => Number(linked(a.from,a.to)) - Number(linked(b.from,b.to))));
const related = computed(() => new Set(connections.value.filter(e => linked(e.from,e.to)).flatMap(e => [e.from,e.to])));
const matching = (t: Research) =>
  !search.value.trim() ||
  [t.name, t.effect, t.boost].some((s) => s.includes(search.value.trim()));
const matches = computed(() => rows.value.filter(matching));
const eraGroups = computed(() => eras.map((name, era) => {
  const group = rows.value.filter(r=>r.era === era);
  return {name, era, first: Math.min(...group.map(r=>r.column)), last: Math.max(...group.map(r=>r.column))};
}));
const prerequisites = (t: Research) => researchPrerequisites(t).map(id=>rows.value.find(r=>r.id===id)!.name).join('、');
const turns = (t: Research) => yieldRate.value > 0
  ? `${Math.max(1, Math.ceil((researchCost(props.state,n.value,t)-(n.value.researchProgress[t.id]??0)-overflow.value)/yieldRate.value))} 回合`
  : '无产出';
const overflow = computed(() => n.value.researchOverflow?.[props.civic ? 'culture' : 'science'] ?? 0);
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
async function revealNode(id: string) {
  await nextTick();
  const at=positions.value[id || firstChoice.value?.id || ''];
  if(at && treeScroll.value) treeScroll.value.scrollTo({left:Math.max(0,at.x-12),top:Math.max(0,at.y-36)});
}
function jumpToEra(era: number) {
  const entry=rows.value.find(r=>r.era===era);
  if(entry) {inspect(entry);void revealNode(entry.id);}
}
function nextMatch() {
  const index=matches.value.findIndex(r=>r.id===selected.value?.id);
  const entry=matches.value[(index+1)%matches.value.length];
  if(entry) {inspect(entry);void revealNode(entry.id);}
}
watch(current, id=>{if(!inspected.value) void revealNode(id);});
watch(search, () => {
  const entry=matches.value[0];
  if(entry && search.value.trim()) {inspect(entry);void revealNode(entry.id);}
  else if(!search.value.trim()) {inspected.value='';void revealNode(current.value);}
});
watch(listMode, value => {if(!value) void revealNode(selected.value?.id ?? current.value);});
onMounted(()=>void revealNode(current.value));
watch(
  () => props.civic,
  () => {
    inspected.value = "";
    search.value = "";
    void revealNode(current.value);
  },
);
</script>
<template>
  <section class="research-view">
    <div class="section-head">
      <div>
        <div class="research-title"><h2>{{ civic ? "市政树" : "科技树" }}</h2><CivHelp label="研究规则" :text="`选择节点后开始研究。切换保留进度，完成后重新选择；溢出点数留给下一项。尤里卡 / 鼓舞减少 ${n.civ === 'china' ? 50 : 40}% 需求，部分条件尚未实现。未来时代使用固定前置。百科中的部分解锁尚不可建造。`" /></div>
        <p>每回合 +{{ yieldRate.toFixed(1) }} {{ civic ? '文化' : '科技' }}<span v-if="overflow"> · 待分配 {{ overflow.toFixed(1) }}</span></p>
      </div>
      <label class="search"
        ><CivIcon name="compass" :size="16" /><input
          v-model="search"
          @keydown.enter.prevent="nextMatch"
          :aria-label="civic ? '搜索市政' : '搜索科技'"
          placeholder="搜索名称或解锁内容"
      /></label>
    </div>
    <div class="research-summary" v-if="selected">
      <CivIcon :name="civic ? 'culture' : 'science'" :size="28" />
      <div>
        <div class="summary-name"><strong
          >{{ selected.name }}
          <span v-if="done.includes(selected.id)">已完成</span></strong
        >
        <CivHelp label="研究效果与提升" :text="`${selected.effect}\n${selected.boost || '无提升条件'}${n.boosts.includes(selected.id) ? '（已触发）' : ''}`" /></div>
        <small
          >{{
            researchPrerequisites(selected).length
              ? "前置：" +
                prerequisites(selected)
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
        :disabled="!active(state) || selected.id === current || !researchAvailable(n, selected.id, civic)"
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
    <div class="tree-tools">
      <div>
        <span class="legend known">已完成</span
        ><span class="legend studying">研究中</span
        ><span class="legend unlocked">可研究</span
        ><span class="legend locked">未解锁</span>
      </div>
      <div class="tree-actions">
        <label class="era-picker">时代<select :value="selected?.era ?? 0" aria-label="跳转研究时代" @change="jumpToEra(Number(($event.target as HTMLSelectElement).value))"><option v-for="(name, era) in eras" :key="era" :value="era">{{ name }}</option></select></label>
        <button aria-label="当前研究" @click="inspected = ''; search = ''; revealNode(current)">当前</button>
        <button v-if="search.trim()" :disabled="!matches.length" @click="nextMatch">{{ matches.length ? `${matches.findIndex(r=>r.id===selected?.id)+1} / ${matches.length}` : '无结果' }}</button>
        <details v-if="selected?.unlocks?.length" class="unlock-details" :key="selected.id">
          <summary>百科解锁 {{ selected.unlocks.length }} 项</summary>
          <ul><li v-for="unlock in selected.unlocks" :key="unlock.id"><a :href="unlock.source" target="_blank" rel="noopener noreferrer">{{ unlock.name }}</a></li></ul>
        </details>
        <button @click="listMode = !listMode" :aria-pressed="listMode">
        {{ listMode ? "连线视图" : "列表视图" }}
        </button>
      </div>
    </div>
    <div v-if="!listMode" ref="treeScroll" class="tree-scroll" tabindex="0" aria-label="研究树，可横向和纵向滚动">
      <div
        class="tree-canvas"
        :style="{ width: width + 'px', height: height + 'px' }"
      >
        <div
          v-for="group in eraGroups"
          :key="group.era"
          class="era-column"
          :data-era="group.era"
          :style="{ left: researchGeometry.left + group.first * researchGeometry.column + 'px', width: (group.last-group.first+1)*researchGeometry.column + 'px', height: height + 'px' }"
        >
          <span>{{ group.name }}</span>
        </div>
        <svg
          class="connections"
          :width="width"
          :height="height"
          aria-hidden="true"
        >
          <defs><marker :id="civic ? 'civic-arrow' : 'tech-arrow'" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6" fill="#d8c98f" /></marker></defs>
          <template v-for="edge in connections" :key="`${edge.from}:${edge.to}`">
            <path :d="edge.path" class="connection-halo" :class="{ focused: linked(edge.from,edge.to) }" />
            <path :d="edge.path" class="connection" :data-from="edge.from" :data-to="edge.to"
              :class="{ focused: linked(edge.from,edge.to), known: done.includes(edge.from) }"
              :marker-end="linked(edge.from,edge.to) ? `url(#${civic ? 'civic-arrow' : 'tech-arrow'})` : undefined" />
          </template>
        </svg>
        <button
          v-for="t in rows"
          :key="t.id"
          class="research-node"
          :data-era="t.era"
          :data-research="t.id"
          :aria-pressed="selected?.id === t.id"
          :aria-label="`${t.name} · ${done.includes(t.id) ? '已完成' : current === t.id ? '研究中' : researchAvailable(n,t.id,civic) ? '可研究' : '未解锁'}`"
          :class="{
            known: done.includes(t.id),
            studying: current === t.id,
            unlocked: researchAvailable(n, t.id, civic),
            dim: !matching(t),
            inspected: selected?.id === t.id,
            related: related.has(t.id),
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
              {{ turns(t) }}</span
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
        <p v-if="t.effect">{{ t.effect }}</p>
        <small>{{
          done.includes(t.id)
            ? "已完成"
            : researchAvailable(n, t.id, civic)
              ? "可研究"
              : "需要 " +
                researchPrerequisites(t)
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
.research-view { display:flex; flex-direction:column; min-width:0; min-height:0; }
.unlock-details { position:relative; padding:0 8px; border:1px solid #53645a; border-radius:6px; }
.unlock-details summary { cursor:pointer; min-height:44px; display:flex; align-items:center; font-size:12px; }
.unlock-details ul { position:absolute; top:100%; right:0; z-index:20; width:220px; max-height:240px; overflow:auto; margin:0; padding:8px 20px; background:#20372f; border:1px solid #67745b; border-radius:6px; box-shadow:0 6px 16px #0006; }
.unlock-details li { list-style:none; }
.unlock-details a { color:#d7c893; display:flex; align-items:center; min-height:44px; }
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
  flex-shrink:0;
}
.section-head > div {display:flex;align-items:center;gap:12px;}
.research-title {display:flex;align-items:center;gap:6px;}
.section-head h2 {
  font-size: 20px;
  margin: 0;
  color: #efe1b2;
  font-family: serif;
}
.section-head p {
  margin: 0;
  font-size: 12px;
  color: #bbc6b6;
}
.search {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #56685b;
  padding: 0 10px;
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
  padding:0;
  min-height:44px;
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
  padding: 4px 10px;
  color: #e7d4a0;
  flex-shrink:0;
}
.research-summary > div {
  flex: 1;
  min-width:0;
}
.summary-name {display:flex;align-items:center;gap:4px;min-width:0;}
.summary-name strong {overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.research-summary > a {font-size:12px;flex-shrink:0;min-height:44px;display:flex;align-items:center;color:#d7c893;}
.research-summary strong {
  font-size: 16px;
}
.research-summary small {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
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
  margin: 4px 0;
  align-items: center;
  flex-shrink:0;
}
.tree-tools > div {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.tree-tools .tree-actions {gap:6px;justify-content:flex-end;}
.era-picker {display:flex;align-items:center;gap:4px;font-size:12px;}
.era-picker select {padding:4px 6px;font-size:14px;min-width:72px;}
.tree-actions button {font-size:12px;}
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
  height: min(62vh, 650px);
  min-height:200px;
  border: 1px solid #4a6355;
  border-radius: 10px;
  background: #1c302d;
  scrollbar-width: thin;
  scrollbar-color: #627865 #1c302d;
  overscroll-behavior:contain;
}
.tree-canvas {
  position: relative;
}
.era-column {
  position: absolute;
  top: 0;
  width: 216px;
  border-right: 1px solid #314a3f;
  pointer-events: none;
  z-index:3;
}
.era-column > span {
  position: sticky;
  display:block;
  width:max-content;
  top:0;
  left:0;
  padding:6px 10px;
  background:#1c302ded;
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
.connection, .connection-halo {fill:none;stroke-linejoin:round;stroke-linecap:round;}
.connection {stroke:#839c8a;stroke-width:1.5;opacity:.3;}
.connection.known {stroke:#b9a86d;}
.connection.focused {stroke:#d8c98f;stroke-width:2;opacity:1;}
.connection-halo {stroke:#1c302d;stroke-width:6;opacity:.3;}
.connection-halo.focused {opacity:1;}
.research-node.related {border-color:#9a9568;}
.research-node {
  display: block;
  position: absolute;
  width: 184px;
  height: 92px;
  border: 1px solid #576b5d;
  background: #263c33;
  border-radius: 8px;
  color: #cfdbc0;
  padding: 6px 8px;
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
  line-height:1.4;
}
.research-node p {
  font-size: 11px;
  margin: 3px 0;
  line-height:1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.research-node small {
  display: block;
  font-size: 10px;
  line-height: 1.35;
  color: #b0c0aa;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
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
  margin: 4px 0 3px;
  overflow: hidden;
}
.node-progress i {
  display: block;
  height: 100%;
  background: #d0c586;
}
.research-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 8px;
  overflow:auto;
  min-height:0;
  align-content:start;
}
.research-list button {
  display: block;
  min-width: 0;
  border: 1px solid #60725d;
  background: #2a4035;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  padding: 10px;
  color: #e0e9cc;
  min-height: 100px;
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
  margin: 5px 0;
}
@media(min-width:851px) {
  .research-summary > div {display:flex;align-items:center;gap:12px;}
  .summary-name {flex-shrink:0;max-width:45%;}
  .research-summary small {flex:1;min-width:0;}
}
button:focus-visible {
  outline: 2px solid #fff1bc;
  outline-offset: 2px;
}
@media (max-width: 650px) {
  .section-head {
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }
  .section-head > div {display:block;flex-shrink:0;}
  .section-head .search {flex:1;min-width:0;}
  .section-head p {font-size:11px;}
  .section-head h2 {font-size:18px;}
  .search input {
    width: 100%;
    font-size: 16px;
  }
  .research-summary {
    gap: 6px;
    padding: 4px 8px;
  }
  .research-summary > a {font-size:0;min-width:44px;justify-content:center;}
  .research-summary > a::after {content:'百科';font-size:12px;}
  .research-summary > svg {
    display: none;
  }
  .research-summary button:not(.civ-help-button) {
    flex-shrink:0;
    padding:6px 8px;
  }
  .research-list {
    grid-template-columns: 1fr;
  }
  .tree-scroll {
    height:60vh;
  }
  .tree-tools {
    flex-direction:column;
    align-items:stretch;
    gap:4px;
  }
  .tree-tools > div {
    gap:8px;
  }
  .tree-tools .tree-actions {flex-wrap:wrap;justify-content:flex-start;}
  .tree-actions > * {flex-shrink:0;}
  .era-picker {font-size:0;}
  .tree-actions button {white-space:nowrap;}
}
:global(.civ-game.expanded.research-open .civ-panel-content) {display:flex;overflow:hidden;}
:global(.civ-game.expanded .research-view) {flex:1;}
:global(.civ-game.expanded .tree-scroll) {flex:1;min-height:0;height:auto;max-height:none;}
@media (max-height:500px) {
  /* Keep the turn controls fixed, but let short screens reach the entire panel. */
  :global(.civ-game.expanded.research-open .civ-panel-content) {overflow:auto;align-items:flex-start;}
  :global(.civ-game.expanded .research-view) {flex:0 0 auto;width:100%;}
  :global(.civ-game.expanded .tree-scroll) {flex:none;height:max(180px,calc(100dvh - 250px));min-height:180px;}
  :global(.civ-game.expanded .research-list) {flex:none;max-height:max(180px,calc(100dvh - 250px));}
  .research-summary > div {display:flex;align-items:center;gap:8px;}
  .summary-name {flex-shrink:0;max-width:45%;}
  .research-summary small {flex:1;min-width:0;}
  .unlock-details ul {position:static;width:220px;max-width:100%;}
}
</style>
