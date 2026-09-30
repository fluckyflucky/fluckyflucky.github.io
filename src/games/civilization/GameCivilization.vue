<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { techs, civics, items, policies, governments } from "./data";
import {
  create,
  found,
  act,
  improve,
  spread,
  nextTurn,
  yields,
  info,
  available,
  chooseProduction,
  researchAvailable,
  slots,
  valid,
  type Tile,
} from "./engine";
import { load, save } from "./store";
const state = ref(load() ?? create()),
  selected = ref(39),
  unitId = ref<number | null>(null),
  tab = ref("地图"),
  placement = ref(""),
  notice = ref(""),
  resetting = ref(false),
  zoom = ref(1),
  file = ref<HTMLInputElement | null>(null);
const nation = computed(() => state.value.nations[0]),
  tile = computed(() => state.value.tiles[selected.value]),
  unit = computed(() => state.value.units.find((u) => u.id === unitId.value)),
  city = computed(() =>
    state.value.cities.find((c) => c.tile === selected.value && c.owner === 0),
  ),
  cityUnits = computed(() =>
    state.value.units.filter((u) => u.tile === selected.value && u.owner === 0),
  ),
  ownCities = computed(() => state.value.cities.filter((c) => c.owner === 0)),
  totals = computed(() =>
    ownCities.value.reduce(
      (a, c) => {
        const y = yields(state.value, c);
        a.science += y.science;
        a.culture += y.culture;
        a.gold += y.gold;
        return a;
      },
      { science: 1, culture: 1, gold: 0 },
    ),
  );
watch(
  state,
  () => {
    notice.value = save(state.value)
      ? "已存到本机"
      : "浏览器禁止存档，请导出备份";
  },
  { deep: true },
);
const colors: Record<string, string> = {
  grass: "#6d9463",
  plain: "#aaa16d",
  forest: "#376d50",
  hill: "#887f62",
  mountain: "#535d64",
  water: "#315d76",
  desert: "#c0a16a",
};
const terrainNames: Record<string, string> = {
  grass: "草原",
  plain: "平原",
  forest: "森林",
  hill: "丘陵",
  mountain: "山脉",
  water: "水域",
  desert: "沙漠",
};
const symbols: Record<string, string> = {
  forest: "♠",
  hill: "⌃",
  mountain: "▲",
  water: "≈",
  desert: "·",
  grass: "",
  plain: "",
};
function center(t: Tile) {
  return { x: 35 + 50 * (t.q + t.r / 2), y: 35 + 43.3 * t.r };
}
function polygon(t: Tile) {
  const p = center(t);
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i - 30) * Math.PI) / 180;
    return `${p.x + 28.5 * Math.cos(a)},${p.y + 28.5 * Math.sin(a)}`;
  }).join(" ");
}
function clickTile(i: number) {
  if (placement.value && city.value) {
    if (chooseProduction(state.value, city.value, placement.value, i)) {
      placement.value = "";
      notice.value = "已安排区域建设";
    } else notice.value = "区域需要本城三格内的空闲陆地";
    return;
  }
  if (unit.value && unit.value.owner === 0 && selected.value !== i) {
    if (act(state.value, unit.value, i)) {
      selected.value = unit.value.tile;
      return;
    }
    notice.value = "无法到达：检查移动力、地形和外交关系";
  }
  selected.value = i;
  unitId.value =
    state.value.units.find((u) => u.tile === i && u.owner === 0)?.id ?? null;
}
function production(id: string) {
  if (!city.value) return;
  if (info(id).kind === "district") {
    placement.value = id;
    notice.value = "点地图上的己方空地放置区域";
  } else chooseProduction(state.value, city.value, id);
}
function togglePolicy(id: string) {
  const p = nation.value.policies;
  if (p.includes(id)) p.splice(p.indexOf(id), 1);
  else if (p.length < slots(state.value)) p.push(id);
}
function end() {
  placement.value = "";
  nextTurn(state.value);
}
function exportSave() {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state.value)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `文明-回合${state.value.turn}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
async function importSave(e: Event) {
  const input = e.target as HTMLInputElement;
  try {
    const f = input.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) throw Error();
    const data = JSON.parse(await f.text());
    if (!valid(data)) throw Error();
    state.value = data;
    unitId.value = null;
    selected.value = state.value.cities.find((c) => c.owner === 0)?.tile ?? 39;
    notice.value = "存档已导入";
  } catch {
    notice.value = "不是有效存档";
  }
  input.value = "";
}
function newGame() {
  state.value = create();
  selected.value = 39;
  unitId.value = null;
  placement.value = "";
  resetting.value = false;
  tab.value = "地图";
}
const tree = computed(() => (tab.value === "科技" ? techs : civics));
</script>

<template>
  <section class="civ">
    <header>
      <div>
        <p class="eyebrow">回合策略 · 单机</p>
        <h1>文明 · 六角世界</h1>
      </div>
      <div class="turn">
        回合 {{ state.turn
        }}<small>{{
          4000 - state.turn * 25 > 0
            ? "公元前 " + (4000 - state.turn * 25)
            : "公元 " + (state.turn * 25 - 4000)
        }}</small>
      </div>
    </header>
    <div class="resources">
      <span>⚗ {{ totals.science.toFixed(1) }} 科技</span
      ><span>♫ {{ totals.culture.toFixed(1) }} 文化</span
      ><span>¤ {{ Math.floor(nation.gold) }} 金币</span
      ><span>☼ {{ Math.floor(nation.faith) }} 信仰</span
      ><span>♜ {{ ownCities.length }} 城市</span>
    </div>
    <nav aria-label="游戏面板">
      <button
        v-for="name in ['地图', '科技', '市政', '政体', '外交', '进度', '存档']"
        :key="name"
        :class="{ active: tab === name }"
        @click="tab = name"
      >
        {{ name }}
      </button>
    </nav>
    <div v-if="state.winner" class="victory">
      {{ state.winner
      }}<button
        @click="
          resetting = true;
          tab = '存档';
        "
      >
        再开一局
      </button>
    </div>
    <template v-if="tab === '地图'">
      <div class="maptools">
        <span>点击单位，再点地块移动或攻击</span
        ><button
          @click="zoom = Math.max(0.7, zoom - 0.2)"
          aria-label="缩小地图"
        >
          −</button
        ><button
          @click="zoom = Math.min(1.8, zoom + 0.2)"
          aria-label="放大地图"
        >
          ＋
        </button>
      </div>
      <div class="mapscroll">
        <svg
          :style="{ width: `${1180 * zoom}px`, height: `${570 * zoom}px` }"
          viewBox="0 0 1180 570"
          role="group"
          aria-label="六角地图"
        >
          <g
            v-for="(t, i) in state.tiles"
            :key="i"
            tabindex="0"
            role="button"
            :aria-label="
              t.seen
                ? `${terrainNames[t.terrain]} ${t.resource} ${t.q},${t.r}`
                : '未探索地块'
            "
            @click="t.seen && clickTile(i)"
            @keydown.enter.prevent="t.seen && clickTile(i)"
            @keydown.space.prevent="t.seen && clickTile(i)"
          >
            <polygon
              :points="polygon(t)"
              :fill="t.seen ? colors[t.terrain] : '#202c32'"
              :stroke="
                selected === i
                  ? '#fff4bf'
                  : t.owner === 0
                    ? '#d4bd73'
                    : t.owner === 1
                      ? '#c67572'
                      : t.owner === 2
                        ? '#8db8d0'
                        : '#263f40'
              "
              :stroke-width="selected === i ? 3 : t.owner >= 0 ? 1.6 : 0.6"
            />
            <template v-if="t.seen">
              <path
                v-if="t.river"
                :d="`M${center(t).x - 22},${center(t).y + 14}l22,-5 20,7`"
                stroke="#7cbcd3"
                fill="none"
                stroke-width="2"
              />
              <text :x="center(t).x" :y="center(t).y + 6" class="terrain">
                {{
                  t.city >= 0
                    ? "♜"
                    : t.district
                      ? info(t.district).icon
                      : t.improvement === "farm"
                        ? "≋"
                        : t.improvement === "mine"
                          ? "⚒"
                          : t.improvement === "pasture"
                            ? "♧"
                            : t.village
                              ? "⌂"
                              : symbols[t.terrain]
                }}
              </text>
              <text
                v-if="t.resource"
                :x="center(t).x"
                :y="center(t).y + 21"
                class="resource"
              >
                {{ t.resource }}
              </text>
              <text
                v-for="u in state.units.filter((u) => u.tile === i)"
                :key="u.id"
                :x="center(t).x"
                :y="center(t).y - 9"
                class="unit"
                :fill="u.owner === 0 ? '#fff4bf' : '#ffaaaa'"
              >
                {{ info(u.type).icon }}
              </text>
              <text
                v-if="t.city >= 0"
                :x="center(t).x"
                :y="center(t).y - 20"
                class="citylabel"
              >
                {{ state.cities.find((c) => c.id === t.city)?.name }}
              </text>
            </template>
          </g>
        </svg>
      </div>
      <div class="selection">
        <h2>
          {{ terrainNames[tile.terrain] }}
          <small>{{ tile.resource }} {{ tile.river ? "· 河流" : "" }}</small>
        </h2>
        <div class="row" v-if="cityUnits.length">
          <button
            v-for="u in cityUnits"
            :key="u.id"
            :class="{ active: u.id === unitId }"
            @click="unitId = u.id"
          >
            {{ info(u.type).name }}
          </button>
        </div>
        <div v-if="unit" class="unitpanel">
          <p>
            {{ info(unit.type).name }} · 生命 {{ Math.round(unit.hp) }} · 移动力
            {{ unit.moves }}
            <span v-if="unit.type === 'builder' || unit.type === 'missionary'"
              >· 次数 {{ unit.charges }}</span
            >
          </p>
          <div class="row">
            <button
              v-if="unit.type === 'settler'"
              @click="
                notice = found(state, unit)
                  ? '城市已建立'
                  : '城市之间至少四格，不能在山脉或水域建城'
              "
            >
              建立城市</button
            ><template v-if="unit.type === 'builder'"
              ><button
                v-for="[id, label] in [
                  ['farm', '农场'],
                  ['mine', '矿山'],
                  ['pasture', '牧场'],
                ]"
                :key="id"
                @click="
                  notice = improve(state, unit, id)
                    ? '地块已改良'
                    : '需要己方空地、对应地形和科技'
                "
              >
                {{ label }}
              </button></template
            ><button
              v-if="unit.type === 'missionary'"
              @click="
                notice = spread(state, unit)
                  ? '信仰已传播'
                  : '需要创立宗教并靠近城市'
              "
            >
              传播宗教</button
            ><button @click="unit.moves = 0">驻守</button
            ><button
              v-if="unit.xp >= 3 && unit.hp < 100"
              @click="
                unit.hp = 100;
                unit.xp -= 3;
                unit.moves = 0;
              "
            >
              晋升并恢复
            </button>
          </div>
        </div>
        <div v-if="city">
          <h2>
            {{ city.name }}
            <small
              >人口 {{ city.pop }} · 生命 {{ Math.round(city.hp) }} · 住房
              {{ yields(state, city).housing }}</small
            >
          </h2>
          <p>
            粮食 {{ yields(state, city).food.toFixed(1) }} / 消耗
            {{ city.pop * 2 }} · 生产
            {{ yields(state, city).production.toFixed(1) }} · 科技
            {{ yields(state, city).science.toFixed(1) }}
          </p>
          <p>
            正在生产：{{
              city.production ? info(city.production).name : "尚未安排"
            }}
            <span v-if="city.production"
              >{{ Math.floor(city.progress) }} /
              {{ info(city.production).cost }}</span
            >
          </p>
          <div class="built">
            {{
              city.buildings.map((b) => info(b).name).join(" · ") ||
              "还没有建筑"
            }}
          </div>
          <div class="choices">
            <button
              v-for="d in items.filter((d) => available(state, city!, d.id))"
              :key="d.id"
              @click="production(d.id)"
            >
              <strong>{{ d.icon }} {{ d.name }}</strong
              ><small>{{ d.cost }} 生产 · {{ d.description }}</small>
            </button>
          </div>
          <button v-if="placement" @click="placement = ''">取消区域放置</button>
        </div>
        <p v-if="!unit && !city">选择己方单位或城市。地图可以左右拖动。</p>
      </div>
    </template>
    <div v-else-if="tab === '科技' || tab === '市政'" class="tree">
      <p>
        当前：{{
          tree.find(
            (t) => t.id === (tab === "科技" ? nation.research : nation.culture),
          )?.name ?? "全部完成"
        }}
        · {{ Math.floor(tab === "科技" ? nation.science : nation.cult) }} 已投入
        · 尤里卡 / 鼓舞减少 40% 需求
      </p>
      <div class="nodes">
        <button
          v-for="t in tree"
          :key="t.id"
          :disabled="!researchAvailable(nation, t.id, tab === '市政')"
          :class="{
            done: (tab === '科技' ? nation.tech : nation.civic).includes(t.id),
            active:
              t.id === (tab === '科技' ? nation.research : nation.culture),
          }"
          @click="
            tab === '科技' ? (nation.research = t.id) : (nation.culture = t.id)
          "
        >
          <strong
            >{{ t.name }}
            {{
              (tab === "科技" ? nation.tech : nation.civic).includes(t.id)
                ? "✓"
                : ""
            }}</strong
          ><small
            >{{ Math.ceil(t.cost * (nation.boosts.includes(t.id) ? 0.6 : 1)) }}
            {{ tab === "科技" ? "科技" : "文化" }} · {{ t.effect }}</small
          ><small
            >前置：{{
              t.requires
                .map((r) => tree.find((t) => t.id === r)?.name)
                .join("、") || "无"
            }}</small
          ><small :class="{ boosted: nation.boosts.includes(t.id) }"
            >{{ nation.boosts.includes(t.id) ? "✓" : "" }} {{ t.boost }}</small
          >
        </button>
      </div>
    </div>
    <div v-else-if="tab === '政体'" class="panel">
      <h2>政体</h2>
      <div class="row">
        <button
          v-for="g in governments"
          :key="g.id"
          :disabled="!!g.unlock && !nation.civic.includes(g.unlock)"
          :class="{ active: nation.government === g.id }"
          @click="
            nation.government = g.id;
            nation.policies = nation.policies.slice(0, g.slots);
          "
        >
          {{ g.name }} · {{ g.slots }} 槽
        </button>
      </div>
      <h2>政策 · {{ nation.policies.length }} / {{ slots(state) }}</h2>
      <div class="choices">
        <button
          v-for="p in policies"
          :key="p.id"
          :disabled="!nation.civic.includes(p.unlock)"
          :class="{ active: nation.policies.includes(p.id) }"
          @click="togglePolicy(p.id)"
        >
          <strong>{{ p.name }}</strong
          ><small>{{ p.description }}</small>
        </button>
      </div>
      <p>古典共和：每城文化 +1；寡头：战斗力 +4；民主：生产 +20%。</p>
    </div>
    <div v-else-if="tab === '外交'" class="panel">
      <article v-for="(n, i) in state.nations.slice(1)" :key="n.name">
        <h2>{{ n.name }} · {{ n.war ? "交战" : "和平" }}</h2>
        <p>
          {{ state.cities.filter((c) => c.owner === i + 1).length }} 城市 ·
          {{ n.tech.length }} 项科技
        </p>
        <div class="row">
          <button @click="n.war = !n.war">
            {{ n.war ? "签订和平" : "宣战" }}</button
          ><button
            :disabled="
              n.war ||
              nation.gold < 40 ||
              nation.trade >=
                1 +
                  ownCities.filter((c) => c.buildings.includes('commercial'))
                    .length
            "
            @click="
              nation.gold -= 40;
              nation.trade++;
              notice = '贸易路线已建立，每城增加金币与粮食';
            "
          >
            贸易路线 · 40 金
          </button>
        </div>
      </article>
      <h2>城邦使者 · {{ state.envoys }}</h2>
      <button
        :disabled="state.envoys < 3"
        @click="
          state.envoys -= 3;
          nation.gold += 60;
          notice = '城邦赠予 60 金币';
        "
      >
        派遣三名使者
      </button>
      <h2>宗教</h2>
      <button
        :disabled="nation.religion || nation.faith < 100"
        @click="
          nation.faith -= 100;
          nation.religion = true;
          ownCities.forEach((c) => (c.religion = 0));
        "
      >
        {{ nation.religion ? "信仰已创立" : "创立信仰 · 100 信仰" }}
      </button>
      <h2>伟人 · {{ Math.floor(state.great) }} / 80</h2>
      <button
        :disabled="state.great < 80"
        @click="
          state.great -= 80;
          nation.science += 80;
          notice = '大科学家贡献 80 科研进度';
        "
      >
        招募大科学家
      </button>
    </div>
    <div v-else-if="tab === '进度'" class="panel">
      <h2>胜利条件</h2>
      <p>科学：建航天中心 → 发射卫星 → 火星殖民</p>
      <p>
        文化：完成大众传媒，累计旅游 800 · 当前 {{ Math.floor(nation.tourism) }}
      </p>
      <p>
        征服：占领所有原始首都 · 当前
        {{ state.cities.filter((c) => c.capital && c.owner === 0).length }} / 3
      </p>
      <p>宗教：创立信仰，传教士使所有城市信奉你的宗教</p>
      <p>分数：250 回合后比较科技、市政、人口和城市</p>
      <h2>回合记录</h2>
      <p v-for="(entry, i) in state.log" :key="i">{{ entry }}</p>
    </div>
    <div v-else class="panel">
      <h2>本机存档</h2>
      <p>每次操作自动保存。清除浏览器数据会丢失进度，换设备请导出再导入。</p>
      <div class="row">
        <button @click="exportSave">导出存档</button
        ><button @click="file?.click()">导入存档</button
        ><button @click="resetting = !resetting">新游戏</button>
      </div>
      <input
        ref="file"
        type="file"
        accept=".json,application/json"
        hidden
        @change="importSave"
      />
      <div v-if="resetting">
        <p>新游戏会覆盖当前本机存档。</p>
        <button @click="newGame">确认重新开始</button
        ><button @click="resetting = false">取消</button>
      </div>
      <details>
        <summary>这一版的规则</summary>
        <p>
          参考文明 6 的六角地图、科技 /
          市政双树、尤里卡、区域邻接、住房、政策、单位与胜利路线。回合和数值为网页单机版调整，不是原作完整移植。外交、宗教、伟人和城邦目前为简化机制；暂无海军、间谍、灾害、多人联机。
        </p>
      </details>
    </div>
    <footer>
      <span role="status">{{ notice || "进度保存在这个浏览器" }}</span
      ><button class="end" :disabled="!!state.winner" @click="end">
        下一回合 →
      </button>
    </footer>
  </section>
</template>

<style scoped>
.civ {
  color: #e7e3d4;
  background: #152329;
  border: 1px solid #53605a;
  border-radius: 12px;
  overflow: hidden;
  font-size: 14px;
}
.civ header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(130deg, #263a3a, #18262c);
}
h1 {
  font-family: serif;
  font-size: 28px;
  margin: 0;
  color: #e5d29a;
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 3px;
  color: #a6b3a6;
  margin: 0 0 7px;
}
.turn {
  text-align: right;
  color: #e5d29a;
  white-space: nowrap;
}
.turn small {
  display: block;
  font-size: 10px;
  color: #acb5ad;
  margin-top: 6px;
}
.resources {
  padding: 12px 16px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  color: #d7cfab;
  border-bottom: 1px solid #3b4b4b;
}
nav {
  display: flex;
  overflow-x: auto;
  padding: 8px;
  gap: 4px;
}
.civ button {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #4c5c58;
  border-radius: 6px;
  background: #253736;
  color: #e0e0cc;
  cursor: pointer;
}
.civ button:hover:not(:disabled) {
  background: #3c5147;
}
.civ button:focus-visible {
  outline: 2px solid #e6c981;
  outline-offset: 2px;
}
.civ button:disabled {
  opacity: 0.4;
  cursor: default;
}
.civ button.active {
  border-color: #dbc383;
  background: #4c5039;
}
.maptools {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 11px;
}
.maptools span {
  flex: 1;
  color: #a9b5ae;
}
.mapscroll {
  overflow: auto;
  max-height: 470px;
  background: #17262d;
  touch-action: pan-x pan-y;
}
.mapscroll svg {
  max-width: none;
  display: block;
}
.terrain {
  font-size: 21px;
  fill: #d6dfc3;
  text-anchor: middle;
  pointer-events: none;
}
.resource {
  font-size: 8px;
  fill: #f7e8c2;
  text-anchor: middle;
  pointer-events: none;
}
.unit {
  font-size: 22px;
  font-weight: bold;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #22352e;
  stroke-width: 3;
  pointer-events: none;
}
.citylabel {
  font-size: 9px;
  fill: #fff0bd;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #22352e;
  stroke-width: 3;
  pointer-events: none;
}
.selection,
.panel,
.tree {
  padding: 16px;
}
.civ h2 {
  font-size: 17px;
  margin: 12px 0;
  color: #d9cb9f;
}
.civ h2 small {
  font-size: 11px;
  color: #aab9af;
}
.civ p {
  line-height: 1.7;
  margin: 10px 0;
  color: #bfc6b8;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.choices,
.nodes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
}
.choices button,
.nodes button {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.civ small {
  font-size: 11px;
  line-height: 1.5;
  color: #b5bda9;
}
.nodes button.done {
  opacity: 1;
  background: #28493d;
  border-color: #608069;
}
.boosted {
  color: #dfcf86 !important;
}
.built {
  color: #92ab9a;
  font-size: 12px;
}
.panel article {
  padding: 0 0 16px;
  border-bottom: 1px solid #42544d;
}
.civ footer {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1b2d2f;
  border-top: 1px solid #56624e;
}
.civ footer span {
  flex: 1;
  font-size: 11px;
  color: #b6c1af;
}
.civ .end {
  background: #cabb83;
  color: #1d2d2a;
  font-weight: bold;
  white-space: nowrap;
}
.victory {
  padding: 16px;
  background: #64592e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.civ details {
  margin-top: 20px;
}
.civ summary {
  cursor: pointer;
  min-height: 44px;
  padding-top: 10px;
}
@media (max-width: 480px) {
  h1 {
    font-size: 22px;
  }
  .civ header {
    padding: 16px;
  }
  .resources {
    gap: 10px;
    font-size: 12px;
  }
  .choices,
  .nodes {
    grid-template-columns: 1fr;
  }
  .mapscroll {
    max-height: 360px;
  }
  .eyebrow {
    letter-spacing: 1px;
  }
}
</style>
