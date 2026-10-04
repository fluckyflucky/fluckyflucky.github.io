<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import type { State, Unit } from "./model";
import { center, hexPoints, mapDimensions, distance } from "./hex";
import {
  visibleTiles,
  reachable,
  combatPreview,
  resourceVisible,
  placementReason,
  adjacency,
  tileYield,
  info,
} from "./world";
import { terrainNames, resources } from "./catalog";
import CivIcon from "./CivIcon.vue";
import CivHelp from './CivHelp.vue';
const props = defineProps<{
  state: State;
  selected: number;
  unit?: Unit;
  mode: string;
  placement?: { city: number; item: string } | null;
  focus: number;
  focusTick: number;
}>();
const emit = defineEmits<{ select: [number]; hover: [number | null] }>();
const cursor = ref(props.selected);
watch(
  () => props.selected,
  (i) => {
    cursor.value = i;
  },
);
watch(
  () => props.mode,
  () => {
    cursor.value = props.selected;
  },
);
const scroll = ref<HTMLDivElement | null>(null),
  zoom = ref(0.95),
  lens = ref(false),
  drag = ref(false),
  moved = ref(false);
const dimensions = computed(() => mapDimensions(props.state)),
  visible = computed(() => visibleTiles(props.state)),
  reach = computed(() =>
    props.unit && props.mode === "move"
      ? reachable(props.state, props.unit)
      : new Map<number, number>(),
  );
const units = computed(
  () =>
    new Map(
      props.state.units
        .filter((u) => u.owner === 0 || visible.value.has(u.tile))
        .map((u) => [u.tile, u]),
    ),
);
const cities = computed(
  () => new Map(props.state.cities.map((c) => [c.tile, c])),
);
const construction = computed(() => new Map(props.state.cities.flatMap(c=>[
  ...Object.entries(c.districtPlacements??{}).map(([id,at])=>[at,id] as const),
  ...c.queue.filter(j=>info(j.item).kind==='district').map(j=>[j.tile,j.item] as const),
])));
const yieldBadges = computed(() => props.state.tiles.map(t => {
  const value = tileYield(props.state,t);
  const entries = (['food','production','gold'] as const).filter(key => value[key] > 0).map(key => ({key,value:value[key]}));
  return {value,entries,width:Math.max(24,entries.length * 18 + 4)};
}));
const placements = computed(() => {
  if (!props.placement) return new Set<number>();
  const c = props.state.cities.find((c) => c.id === props.placement!.city);
  return new Set(
    c
      ? props.state.tiles
          .map((_, i) => i)
          .filter(
            (i) => !placementReason(props.state, c, props.placement!.item, i),
          )
      : [],
  );
});
const targets = computed(
  () =>
    new Set(
      props.unit && props.mode === "attack"
        ? props.state.tiles
            .map((_, i) => i)
            .filter(
              (i) =>
                visible.value.has(i) &&
                !!combatPreview(props.state, props.unit!, i),
            )
        : [],
    ),
);
const colors: Record<string, string> = {
  grass: "#89a97b",
  plain: "#b5b783",
  forest: "#658665",
  hill: "#a8a080",
  mountain: "#8e9690",
  water: "#50829a",
  desert: "#d5bf8d",
};
let start = { x: 0, y: 0, left: 0, top: 0 },
  lastPointer = "";
function down(e: PointerEvent) {
  if (e.pointerType !== "mouse" || e.button !== 0) return;
  start = {
    x: e.clientX,
    y: e.clientY,
    left: scroll.value!.scrollLeft,
    top: scroll.value!.scrollTop,
  };
  drag.value = true;
  moved.value = false;
  lastPointer = "mouse";
}
function pan(e: PointerEvent) {
  if (!drag.value) return;
  const dx = e.clientX - start.x,
    dy = e.clientY - start.y;
  if (Math.hypot(dx, dy) > 5) moved.value = true;
  if (moved.value && scroll.value) {
    scroll.value.scrollLeft = start.left - dx;
    scroll.value.scrollTop = start.top - dy;
  }
}
function up() {
  drag.value = false;
}
function select(i: number) {
  if (lastPointer === "mouse" && moved.value) {
    moved.value = false;
    return;
  }
  if (props.state.tiles[i].seen) {
    cursor.value = i;
    emit("select", i);
  }
}
async function focusTile(i = props.focus) {
  await nextTick();
  const el = scroll.value;
  if (!el || !props.state.tiles[i]) return;
  const p = center(props.state.tiles[i]);
  el.scrollTo({
    left: p.x * zoom.value - el.clientWidth / 2,
    top: p.y * zoom.value - el.clientHeight / 2,
    behavior: "auto",
  });
}
watch(
  () => [props.focusTick, props.state.options.seed],
  () => focusTile(),
  { immediate: true },
);
function scale(change: number) {
  const el = scroll.value;
  if (!el) return;
  const x = (el.scrollLeft + el.clientWidth / 2) / zoom.value,
    y = (el.scrollTop + el.clientHeight / 2) / zoom.value;
  zoom.value = Math.min(1.5, Math.max(0.55, zoom.value + change));
  nextTick(() =>
    el.scrollTo({
      left: x * zoom.value - el.clientWidth / 2,
      top: y * zoom.value - el.clientHeight / 2,
    }),
  );
}
function keyboard(e: KeyboardEvent) {
  const t = props.state.tiles[cursor.value],
    dirs: Record<string, number[]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    };
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    select(cursor.value);
    return;
  }
  const dir = dirs[e.key];
  if (dir) {
    e.preventDefault();
    const q = t.q + dir[0],
      r = t.r + dir[1],
      i = r * props.state.width + q;
    if (
      q >= 0 &&
      q < props.state.width &&
      r >= 0 &&
      r < props.state.height &&
      props.state.tiles[i].seen
    ) {
      cursor.value = i;
      emit("hover", i);
      focusTile(i);
      nextTick(() =>
        scroll.value
          ?.querySelector<SVGElement>(`[data-tile="${i}"]`)
          ?.focus({ preventScroll: true }),
      );
    }
  }
}
</script>
<template>
  <div class="world-map">
    <div class="cartography">
      <span
        ><CivIcon name="compass" :size="16" />{{
          mode === "move"
            ? "蓝色地块可移动"
            : mode === "attack"
              ? "红色地块可攻击"
              : placement
                ? "选择高亮地块建设"
                : "拖动地图 · 点击地块查看"
        }}</span
      >
      <div>
        <CivHelp action icon="food" label="显示地块产出" text="开关地块产出图层。嫩芽是粮食，锤子是生产力，金币图标是金币；只显示非零产出。" :pressed="lens" @activate="lens=!lens" />
        <CivHelp action icon="compass" label="定位当前单位或城市" text="将地图移回当前选中的单位或城市，不会移动单位或消耗行动。" @activate="focusTile()" />
        <CivHelp action icon="minus" label="缩小地图" text="缩小地图，保持视野中心。" @activate="scale(-0.15)" />
        <CivHelp action icon="plus" label="放大地图" text="放大地图，保持视野中心。" @activate="scale(0.15)" />
      </div>
    </div>
    <div v-if="lens" class="yield-legend">
      <span><CivIcon name="food" :size="16" />粮食</span><span><CivIcon name="production" :size="16" />生产力</span><span><CivIcon name="gold" :size="16" />金币</span>
      <CivHelp label="地块产出说明" text="图标旁的数字是粮食、生产力和金币。市民工作的地块才计入城市产出。城市名后的数字是人口。" />
    </div>
    <div
      ref="scroll"
      class="world-scroll"
      :class="{ dragging: drag }"
      @pointerdown="down"
      @pointermove="pan"
      @pointerup="up"
      @pointerleave="up"
      @pointercancel="up"
      @keydown="keyboard"
      tabindex="0"
      role="group"
      aria-label="世界地图，方向键选择地块，回车确认"
    >
      <svg
        :width="dimensions.width * zoom"
        :height="dimensions.height * zoom"
        :viewBox="`0 0 ${dimensions.width} ${dimensions.height}`"
        class="terrain-map"
        @touchstart="lastPointer = 'touch'"
      >
        <defs>
          <pattern
            id="civ-grass"
            width="16"
            height="17"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="m3 12 1-3 1 3m6-8 1-2 1 2"
              stroke="#5b845e"
              stroke-width=".9"
              opacity=".4"
            />
          </pattern>
          <pattern
            id="civ-ocean"
            width="40"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M2 8q6-3 13 0m5 13q6-3 13 0"
              fill="none"
              stroke="#b2dae1"
              opacity=".3"
            />
          </pattern>
          <pattern
            id="civ-fog"
            width="35"
            height="35"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="m0 0 35 35m0-35 35 35m-35 0 35 35"
              stroke="#354148"
              stroke-width=".8"
              opacity=".35"
            />
          </pattern>
          <g id="civ-pine">
            <path d="m0-16-9 12h4l-7 9h9v6h6V5h9l-7-9h4z" fill="#305345" />
            <path d="m0-14-6 9h5l-6 7h7" fill="#49735b" />
          </g>
          <g id="civ-mountain">
            <path d="m-25 15 23-40 24 40z" fill="#717e7c" />
            <path d="m-2-25 24 40H4z" fill="#515e64" />
            <path d="m-2-25-8 15 7-2 5 4 4-3z" fill="#e8e8d3" />
          </g>
          <g id="civ-town">
            <path
              d="M-18 16V0h12v16m1 0v-24H7v24m2 0V-2h12v18"
              fill="#ede3c0"
              stroke="#62654f"
            />
            <path
              d="m-20 0 8-6 8 6m-3-8 7-6 8 6m-1 6 8-6 7 6"
              fill="#98744c"
              stroke="#634f3c"
            />
            <path d="M0 4v8m-13-7v3m28-3v3" stroke="#66775f" stroke-width="3" />
          </g>
        </defs>
        <g
          v-for="(t, i) in state.tiles"
          :key="i"
          :transform="`translate(${center(t).x},${center(t).y})`"
          role="button"
          :aria-label="
            t.seen
              ? `${terrainNames[t.terrain]} ${resourceVisible(state.nations[0], t) ? (resources[t.resource]?.name ?? '') : ''}，坐标 ${t.q},${t.r}`
              : '未探索'
          "
          :tabindex="cursor === i ? 0 : -1"
          :data-tile="i"
          @click="select(i)"
          @mouseenter="emit('hover', i)"
          @mouseleave="emit('hover', null)"
        >
          <polygon
            :points="hexPoints"
            :fill="t.seen ? colors[t.terrain] : '#25343b'"
            stroke="#334c48"
            stroke-width=".65"
          />
          <polygon
            v-if="cursor === i && selected !== i"
            :points="hexPoints"
            fill="none"
            stroke="#fff1a9"
            stroke-width="2.5"
            stroke-dasharray="4 3"
          />
          <template v-if="t.seen">
            <polygon
              v-if="t.terrain === 'grass' || t.terrain === 'plain'"
              :points="hexPoints"
              fill="url(#civ-grass)"
            />
            <polygon
              v-if="t.terrain === 'water'"
              :points="hexPoints"
              fill="url(#civ-ocean)"
            />
            <path
              v-if="t.terrain === 'hill'"
              d="M-26 11q10-27 23-7 9-24 29 7M-23 17q13-16 26-4 12-12 23 3"
              fill="#8d936f"
              stroke="#747d61"
              stroke-width="1"
            />
            <use v-if="t.terrain === 'mountain'" href="#civ-mountain" />
            <g v-if="t.terrain === 'forest' || t.feature === 'forest'">
              <use href="#civ-pine" transform="translate(-11,0) scale(.8)" />
              <use href="#civ-pine" transform="translate(12,-4) scale(.7)" />
              <use href="#civ-pine" transform="translate(0,9)" />
            </g>
            <path
              v-if="t.terrain === 'desert'"
              d="M-22 9q10-15 23-3 10-16 24-5M-17 20q12-13 31-4"
              fill="none"
              stroke="#ac9465"
              opacity=".5"
            />
            <path
              v-if="t.river"
              d="M-29 17Q-14 7 0 16T29 17"
              stroke="#bad5d0"
              stroke-width="6"
              fill="none"
            />
            <path
              v-if="t.river"
              d="M-29 17Q-14 7 0 16T29 17"
              stroke="#609aaf"
              stroke-width="3"
              fill="none"
            />
            <path
              v-if="t.road"
              d="M-25 0Q0 12 26 0"
              stroke="#c6b086"
              stroke-width="3"
              stroke-dasharray="3 2"
              fill="none"
            />
            <g
              v-if="t.improvement === 'farm'"
              stroke="#e2c875"
              stroke-width="3"
            >
              <path d="m-18 10 9-8m-3 11 9-8m-3 11 9-8m-3 11 9-8" />
            </g>
            <g v-else-if="t.improvement === 'mine'" transform="translate(0,8)">
              <path d="m-13 10 2-14 11-5 12 5 2 14z" fill="#625747" />
              <path d="M-5 10V0H5v10" fill="#283839" />
              <path
                d="M-8 10V-3H8v13"
                stroke="#c6aa73"
                fill="none"
                stroke-width="3"
              />
            </g>
            <path
              v-else-if="t.improvement"
              d="M-16 10h32m-25-9v16m18-16v16M-12 0l12-7 12 7"
              stroke="#d3c394"
              fill="none"
              stroke-width="3"
            />
            <use v-if="t.city >= 0" href="#civ-town" />
            <g v-else-if="t.district" transform="translate(-10,-10)">
              <rect
                x="-6"
                y="-6"
                width="32"
                height="32"
                rx="6"
                :fill="
                  info(t.district).kind === 'wonder' ? '#947c49' : '#3b6560'
                "
                stroke="#e1cd9d"
              />
              <CivIcon
                :name="info(t.district).icon"
                :size="20"
                style="color: #f2e8c8"
              />
            </g>
            <g v-else-if="construction.has(i)" transform="translate(-10,-10)">
              <rect x="-6" y="-6" width="32" height="32" rx="6" fill="#3b6560" stroke="#e1cd9d" stroke-dasharray="4 3" />
              <CivIcon :name="info(construction.get(i)!).icon" :size="20" style="color:#f2e8c8;opacity:.7" />
              <text x="10" y="32" text-anchor="middle" fill="#fff1c5" font-size="10">待建</text>
            </g>
            <g v-else-if="t.village" fill="#d9b780" stroke="#806449">
              <path d="m-16 13 9-18 9 18zm15 0 9-14 9 14z" />
              <path d="m-7 4 3 9" />
            </g>
            <g v-if="t.camp">
              <path d="m-17 14 17-27 17 27z" fill="#985d4d" stroke="#4e4035" />
              <path
                d="M0-13V-23l14 4-14 4M-3 14V3h6v11"
                stroke="#cdae8c"
                fill="none"
                stroke-width="2"
              />
            </g>
            <g
              v-if="t.resource && resourceVisible(state.nations[0], t)"
              transform="translate(13,15)"
            >
              <rect
                x="-12"
                y="-7"
                width="24"
                height="16"
                rx="7"
                fill="#293d38"
                opacity=".9"
              />
              <text y="4" class="resource-text">
                {{ resources[t.resource].name }}
              </text>
            </g>
            <g
              v-if="lens && !t.district && t.city < 0"
              transform="translate(0,-19)"
              class="tile-yield-badge"
            >
              <title>{{ `粮食 ${yieldBadges[i].value.food}，生产力 ${yieldBadges[i].value.production}，金币 ${yieldBadges[i].value.gold}` }}</title>
              <rect
                :x="-yieldBadges[i].width/2"
                y="-9"
                :width="yieldBadges[i].width"
                height="17"
                rx="8"
                fill="#182c2d"
                opacity=".88"
              />
              <g v-for="(entry,j) in yieldBadges[i].entries" :key="entry.key" :transform="`translate(${-yieldBadges[i].entries.length*9+j*18},-5)`">
                <CivIcon :name="entry.key" :size="10" :style="{color:entry.key==='food'?'#b6d999':entry.key==='production'?'#edcfaa':'#f1d283'}" />
                <text x="13" y="8" class="yield-text">{{ entry.value }}</text>
              </g>
              <text v-if="!yieldBadges[i].entries.length" y="3" class="yield-text">—</text>
            </g>
            <polygon
              v-if="!visible.has(i)"
              :points="hexPoints"
              fill="#182f35"
              opacity=".35"
            />
            <polygon
              v-if="t.owner >= 0"
              :points="hexPoints"
              fill="none"
              :stroke="state.nations[t.owner].color"
              stroke-width="2"
              stroke-dasharray="4 2"
              opacity=".65"
            />
            <polygon
              v-if="reach.has(i) || placements.has(i) || targets.has(i)"
              :points="hexPoints"
              :fill="
                targets.has(i)
                  ? '#bd625b'
                  : placements.has(i)
                    ? '#e5cf87'
                    : '#73cde0'
              "
              fill-opacity=".23"
              :stroke="
                targets.has(i)
                  ? '#ff9c8a'
                  : placements.has(i)
                    ? '#fff1bb'
                    : '#abedfa'
              "
              stroke-width="2"
            />
            <text v-if="placements.has(i)" y="-14" class="yield-text">
              +{{ adjacency(state, placement!.item, i) }}
            </text>
            <g v-if="units.has(i)" transform="translate(-12,-13)">
              <circle
                cx="12"
                cy="12"
                r="16"
                :fill="state.nations[units.get(i)!.owner].color"
                stroke="#2e4744"
                stroke-width="2"
              />
              <CivIcon
                :name="info(units.get(i)!.type).icon"
                :size="24"
                style="color: #203634"
              />
              <rect x="-1" y="28" width="26" height="3" rx="1" fill="#263b38" />
              <rect
                x="-1"
                y="28"
                :width="(26 * units.get(i)!.hp) / 100"
                height="3"
                rx="1"
                fill="#eaf5b8"
              />
            </g>
            <g v-if="cities.has(i)" transform="translate(0,-35)">
              <rect
                x="-35"
                y="-12"
                width="70"
                height="22"
                rx="11"
                fill="#233d3c"
                :stroke="state.nations[cities.get(i)!.owner].color"
              />
              <text class="city-text" y="3">
                {{ cities.get(i)!.name }} {{ cities.get(i)!.pop }}
              </text>
            </g>
            <path
              v-if="t.pillaged"
              d="m-9-2 18 18m0-18L-9 16"
              stroke="#a23c30"
              stroke-width="4"
            />
          </template>
          <polygon v-else :points="hexPoints" fill="url(#civ-fog)" />
          <polygon
            v-if="selected === i"
            :points="hexPoints"
            fill="none"
            stroke="#fff1c0"
            stroke-width="3.2"
            class="selection-ring"
          />
        </g>
      </svg>
    </div>
    <div class="map-bottom">
      <span>缩放 {{ Math.round(zoom * 100) }}%</span
      ><span
        >{{ state.options.map === "continents" ? "大陆" : "盘古大陆" }} ·
        {{ state.width }} × {{ state.height }}</span
      >
    </div>
    <svg
      class="minimap"
      :viewBox="`0 0 ${dimensions.width} ${dimensions.height}`"
      role="img"
      aria-label="已探索世界缩略图"
    >
      <polygon
        v-for="(t, i) in state.tiles"
        :key="i"
        :points="hexPoints"
        :transform="`translate(${center(t).x},${center(t).y})`"
        :fill="
          t.seen
            ? t.owner >= 0
              ? state.nations[t.owner].color
              : colors[t.terrain]
            : '#23343c'
        "
      />
      <circle
        :cx="center(state.tiles[selected]).x"
        :cy="center(state.tiles[selected]).y"
        r="26"
        fill="none"
        stroke="#fff"
        stroke-width="10"
      />
    </svg>
  </div>
</template>
<style scoped>
.world-map {
  position: relative;
  background: #203840;
  overflow: hidden;
  border: 1px solid #63766a;
  border-radius: 12px;
  min-width: 0;
}
.cartography {
  background: #203431;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
  border-bottom: 1px solid #53675b;
}
.cartography > span {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #c4d0bb;
  font-size: 12px;
}
.cartography > div {
  display: flex;
  gap: 4px;
}
.cartography button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid #586e5f;
  border-radius: 6px;
  color: #e6dab6;
  background: #2c4339;
  cursor: pointer;
}
.yield-legend {display:flex;align-items:center;gap:12px;padding:0 10px;background:#20352e;border-bottom:1px solid #53675b;}
.yield-legend > span {display:flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap;}
.yield-legend > span:nth-child(1) {color:#b6d999;}
.yield-legend > span:nth-child(2) {color:#edcfaa;}
.yield-legend > span:nth-child(3) {color:#f1d283;}
.yield-legend .civ-help-button {margin-left:auto;}
.cartography button:hover,
.cartography button.selected {
  background: #516348;
}
.world-scroll {
  height: 530px;
  max-height: 65vh;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #657667 #233b3d;
  touch-action: pan-x pan-y;
  cursor: grab;
  overscroll-behavior: contain;
}
.world-scroll.dragging {
  cursor: grabbing;
}
.terrain-map {
  max-width: none;
  display: block;
  user-select: none;
}
.terrain-map g[role="button"] {
  cursor: pointer;
  outline: none;
}
.terrain-map g[role="button"]:focus-visible .selection-ring {
  stroke: #fff;
}
.resource-text,
.city-text,
.yield-text {
  text-anchor: middle;
  fill: #f4edcb;
  font:
    10px system-ui,
    sans-serif;
  pointer-events: none;
}
.city-text {
  font-size: 11px;
}
.yield-text {
  font-size: 9px;
}
.map-bottom {
  display: flex;
  justify-content: space-between;
  padding: 9px 12px;
  color: #bfccbc;
  font-size: 10px;
  background: #203431;
}
.minimap {
  position: absolute;
  right: 12px;
  bottom: 46px;
  width: 132px;
  height: 82px;
  border: 1px solid #a7aa83;
  border-radius: 7px;
  background: #263e41;
  pointer-events: none;
  opacity: 0.92;
}
@media (max-width: 600px) {
  .world-scroll {
    height: 410px;
    max-height: 52vh;
  }
  .cartography > span {
    max-width: 125px;
    font-size: 11px;
  }
  .cartography {
    padding: 7px;
    gap: 4px;
  }
  .cartography > div {
    gap: 2px;
  }
  .minimap {
    width: 100px;
    height: 65px;
  }
}
</style>
