<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import HexWorld from "./HexWorld.vue";
import ResearchTree from "./ResearchTree.vue";
import CityPanel from "./CityPanel.vue";
import UnitPanel from "./UnitPanel.vue";
import CivIcon from "./CivIcon.vue";
import CivHelp from './CivHelp.vue';
import { majorIds, aiStrategy, aiStrategyNames } from './participants';
import { cityStateTypes, cityStateHelp, cityStateRoster, suzerain, influenceRate } from './city-states';
import { pantheons, beliefs, availableBeliefs } from './religion';
import { scientistById } from './great-people';
import {
  create,
  defaultOptions,
  ownCities,
  totals,
  info,
  move,
  attack,
  enqueue,
  nextTurn,
  pending,
  era,
  jobCost,
  jobKey,
  yields,
  government,
  configureGovernment,
  relation,
  atWar,
  diplomacy,
  sendEnvoy,
  tradeCapacity,
  pantheon,
  foundReligion,
  recruitProphet,
  prophetCost,
  religionLimit,
  religionCity,
  recruitArtist,
  recruitScientist,
  currentScientist,
  scientistCost,
  scientistPoints,
  hasPolicy,
  score,
  buyTile,
  cityAttack,
  active,
  visibleTiles,
  resourceVisible,
  foreignTourists,
  cultureTarget,
  turnLimit,
} from "./world";
import { distance } from "./hex";
import { load, save, migrate, restoreManual, manualSummary } from "./saves";
import {
  civilizations,
  eras,
  techs,
  civics,
  policies,
  governments,
  policyAvailable,
  policyTypeNames,
  resources,
  terrainNames,
  yieldNames,
  type YieldKey,
} from "./catalog";
import type { State, City, Options } from "./model";
import "./civilization.css";

const initial = load(),
  state = ref<State>(initial.state ?? create()),
  autoAllowed = ref(!initial.error),
  started = ref(!!initial.state),
  setup = ref(!initial.state),
  turnConfirm = ref(false),
  restoreConfirm = ref(false);
const options = ref<Options>({ ...defaultOptions(), ...state.value.options }),
  seedInput = ref(""),
  tab = ref("地图"),
  selection = ref(
    initial.state?.cities.find((c) => c.owner === 0)?.tile ??
      state.value.units.find((u) => u.owner === 0 && u.type === "settler")
        ?.tile ??
      0,
  ),
  unitId = ref<number | null>(
    state.value.units.find((u) => u.owner === 0 && u.tile === selection.value)
      ?.id ?? null,
  ),
  inspect = ref("单位"),
  mode = ref("inspect"),
  focus = ref(selection.value),
  focusTick = ref(0),
  hover = ref<number | null>(null),
  attackTarget = ref<number | null>(null),
  placement = ref<{ city: number; item: string } | null>(null),
  file = ref<HTMLInputElement | null>(null),
  modal = ref<HTMLElement | null>(null),
  notice = ref(
    initial.error || (initial.migrated ? "已迁移旧存档，原存档仍保留。" : ""),
  ),
  savedMessage = ref(initial.state ? "已读取本机存档" : "尚未开局"),
  manual = ref(manualSummary()),
  turnBusy = ref(false),
  warnUnfinished = ref(true),
  policyDraft = ref<(string | null)[]>([]),
  governmentDraft = ref("chief");
const majorNations = computed(() => state.value.nations.filter(n=>n.kind==='major'));
const followerBelief=ref(''),founderBelief=ref('');
const setupCivilization = computed(() => civilizations.find(c=>c.id===options.value.civilization));
const expanded = ref(false);
let previousOverflow = "";
watch(expanded, (value) => {
  if (value) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  } else document.body.style.overflow = previousOverflow;
});
const dialogs = computed(
    () => setup.value || turnConfirm.value || restoreConfirm.value,
  ),
  nation = computed(() => state.value.nations[0]),
  civ = computed(() => civilizations.find((c) => c.id === nation.value.civ)!),
  tile = computed(() => state.value.tiles[selection.value]),
  unit = computed(() =>
    state.value.units.find((u) => u.id === unitId.value && u.owner === 0),
  ),
  city = computed(() =>
    state.value.cities.find((c) => c.tile === selection.value && c.owner === 0),
  ),
  cities = computed(() => ownCities(state.value)),
  output = computed(() => totals(state.value)),
  todo = computed(() => pending(state.value)),
  visible = computed(() => visibleTiles(state.value)),
  selectedUnits = computed(() =>
    state.value.units.filter(
      (u) =>
        u.tile === selection.value &&
        (u.owner === 0 || visible.value.has(u.tile)),
    ),
  ),
  selectedCity = computed(() =>
    state.value.cities.find((c) => c.tile === selection.value),
  ),
  viewedUnit = computed(() => selectedUnits.value.find((u) => u.owner !== 0)),
  nearCity = computed(
    () =>
      cities.value
        .filter((c) => distance(state.value.tiles[c.tile], tile.value) <= 3)
        .sort(
          (a, b) =>
            distance(state.value.tiles[a.tile], tile.value) -
            distance(state.value.tiles[b.tile], tile.value),
        )[0],
  ),
  currentTech = computed(() =>
    techs.find((t) => t.id === nation.value.research),
  ),
  currentCivic = computed(() =>
    civics.find((t) => t.id === nation.value.culture),
  ),
  draftGov = computed(() =>
    governments.find((g) => g.id === governmentDraft.value)!,
  ),
  previewTarget = computed(() => attackTarget.value ?? hover.value),
  year = computed(() => {
    const y = -4000 + (state.value.turn - 1) * 30;
    return y < 0 ? `公元前 ${Math.abs(y)}` : `公元 ${y || 1}`;
  }),
  victoryNames = {
    science: "科学胜利",
    culture: "文化胜利",
    domination: "征服胜利",
    religion: "宗教胜利",
    score: "分数胜利",
    defeat: "文明覆灭",
  };
let timer: ReturnType<typeof setTimeout> | undefined,
  previousFocus: HTMLElement | null = null;
function tell(message: string) {
  notice.value = message;
}
function persist() {
  if (autoAllowed.value && started.value) {
    savedMessage.value = save(state.value)
      ? "已自动保存到本机"
      : "保存失败，请导出备份";
    if (savedMessage.value.startsWith("保存失败"))
      notice.value = savedMessage.value;
  }
}
watch(
  state,
  () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(persist, 200);
  },
  { deep: true },
);
watch(tab, () => {
  if (tab.value === "政体") {
    governmentDraft.value = nation.value.government;
    policyDraft.value = [...nation.value.policies];
  }
});
watch(dialogs, async (value) => {
  if (value) {
    previousFocus = document.activeElement as HTMLElement;
    await nextTick();
    modal.value?.querySelector<HTMLElement>("button,input,select")?.focus();
  } else previousFocus?.focus();
});
onMounted(() => {
  window.addEventListener("pagehide", persist);
  if (dialogs.value)
    nextTick(() =>
      modal.value?.querySelector<HTMLElement>("button,input,select")?.focus(),
    );
});
onBeforeUnmount(() => {
  if (expanded.value) document.body.style.overflow = previousOverflow;
  if (timer) clearTimeout(timer);
  persist();
  window.removeEventListener("pagehide", persist);
});
function modalKeys(e: KeyboardEvent) {
  if (e.key === "Escape") {
    if (started.value) {
      setup.value = false;
      turnConfirm.value = false;
      restoreConfirm.value = false;
    }
    return;
  }
  if (e.key !== "Tab") return;
  const controls = Array.from(
    modal.value?.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input,select,[tabindex="0"]',
    ) ?? [],
  ).filter((el) => el.offsetParent !== null);
  const first = controls[0],
    last = controls[controls.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last?.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first?.focus();
  }
}
function select(i: number) {
  if (placement.value) {
    const c = state.value.cities.find((c) => c.id === placement.value!.city);
    if (c && enqueue(state.value, c, placement.value.item, i)) {
      tell(`${info(placement.value.item).name}已加入${c.name}队列`);
      selection.value = c.tile;
      placement.value = null;
      inspect.value = "城市";
    } else tell("这个地块不可建设，请选择高亮位置");
    return;
  }
  if (mode.value === "move" && unit.value) {
    if (move(state.value, unit.value, i)) {
      selection.value = unit.value.tile;
      tell("单位已移动");
      if (!unit.value.moves) mode.value = "inspect";
    } else tell("无法移动到这里，检查地形、边界与移动力");
    return;
  }
  if (mode.value === "attack" && unit.value) {
    attackTarget.value = i;
    selection.value = unit.value.tile;
    return;
  }
  if (mode.value === "cityAttack" && city.value) {
    tell(
      cityAttack(state.value, city.value, i)
        ? "城市已进行远程攻击"
        : "城墙、射程或目标不符合条件",
    );
    mode.value = "inspect";
    return;
  }
  selection.value = i;
  const u = state.value.units.find((u) => u.tile === i && u.owner === 0);
  unitId.value = u?.id ?? null;
  inspect.value = u ? "单位" : "城市";
  attackTarget.value = null;
}
function setMode(value: string) {
  mode.value = value;
  attackTarget.value = null;
  if (value === "attack") tell("点选红色目标，再确认攻击");
  else if (value === "move") tell("点选蓝色地块移动");
}
function confirmAttack() {
  if (unit.value && attackTarget.value !== null) {
    tell(
      attack(state.value, unit.value, attackTarget.value)
        ? "攻击完成"
        : "目标不在范围内或尚未宣战",
    );
    mode.value = "inspect";
    attackTarget.value = null;
  }
}
function locate(i: number) {
  selection.value = i;
  focus.value = i;
  focusTick.value++;
  tab.value = "地图";
  mode.value = "inspect";
  placement.value = null;
  const u = state.value.units.find((u) => u.tile === i && u.owner === 0);
  unitId.value = u?.id ?? null;
  inspect.value = state.value.cities.some((c) => c.tile === i && c.owner === 0)
    ? "城市"
    : "单位";
}
function locateUnit(id: number) {
  const u = state.value.units.find((u) => u.id === id);
  if (!u) return;
  locate(u.tile);
  unitId.value = id;
  inspect.value = "单位";
}
function place(c: City, item: string) {
  placement.value = { city: c.id, item };
  mode.value = "inspect";
  focus.value = c.tile;
  focusTick.value++;
  tell(`${info(item).name}：选择高亮地块，数字表示邻接加成`);
}
async function endTurn(force = false) {
  if (turnBusy.value || !active(state.value)) return;
  if (
    !force &&
    warnUnfinished.value &&
    (todo.value.cities.length || todo.value.units.length)
  ) {
    turnConfirm.value = true;
    return;
  }
  turnConfirm.value = false;
  turnBusy.value = true;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  try {
    nextTurn(state.value);
    mode.value = "inspect";
    placement.value = null;
    attackTarget.value = null;
    tell(
      state.value.log.find((e) => e.turn === state.value.turn - 1)?.text ??
        "新回合开始",
    );
    persist();
  } catch {
    tell("回合处理出错，请先导出存档，进度仍在本机");
  } finally {
    turnBusy.value = false;
  }
}
function startGame() {
  let seed = Date.now() >>> 0;
  if (seedInput.value.trim()) {
    const value = seedInput.value.trim();
    seed = 0;
    for (const ch of value)
      seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
  }
  state.value = create({ ...options.value, seed });
  followerBelief.value='';founderBelief.value='';
  autoAllowed.value = true;
  started.value = true;
  setup.value = false;
  tab.value = "地图";
  locate(
    state.value.units.find((u) => u.owner === 0 && u.type === "settler")!.tile,
  );
  inspect.value = "单位";
  notice.value = "先建立城市，再安排研究和生产。";
  persist();
}
function newSetup() {
  options.value = { ...defaultOptions(), ...state.value.options };
  setup.value = true;
}
function governmentChange() {
  policyDraft.value = draftGov.value.slots.map(() => null);
}
function applyPolicies() {
  tell(
    configureGovernment(state.value, governmentDraft.value, policyDraft.value)
      ? "政体与政策已应用"
      : "检查政策槽、重复政策或金币是否足够",
  );
}
function diplomat(o: number, a: "war" | "peace" | "delegate" | "friend") {
  const ok = diplomacy(state.value, o, a);
  tell(
    ok
      ? "外交行动完成"
      : a === "peace"
        ? "开战八回合后才能和谈"
        : a === "friend"
          ? "需要至少 +10 好感与和平状态"
          : "当前无法执行此外交行动",
  );
}
function exportSave() {
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(state.value)], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = `六角世界-${nation.value.name}-回合${state.value.turn}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  tell("存档已导出");
}
function replaceState(s: State) {
  state.value = s;
  autoAllowed.value = true;
  started.value = true;
  setup.value = false;
  restoreConfirm.value = false;
  locate(
    s.cities.find((c) => c.owner === 0)?.tile ??
      s.units.find((u) => u.owner === 0)?.tile ??
      0,
  );
  persist();
}
async function importSave(e: Event) {
  const input = e.target as HTMLInputElement;
  try {
    const f = input.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) throw Error();
    const s = migrate(JSON.parse(await f.text()));
    if (!s) throw Error();
    replaceState(s);
    tell("存档已导入");
  } catch {
    tell("存档格式或内容无效，当前进度未改变");
  }
  input.value = "";
}
function manualSave() {
  tell(save(state.value, true) ? "已保存手动快照" : "保存失败，请导出备份");
  manual.value = manualSummary();
}
function manualRestore() {
  const s = restoreManual();
  if (s) {
    replaceState(s);
    tell("已恢复手动存档");
  } else {
    restoreConfirm.value = false;
    tell("没有可读取的手动存档");
  }
}
const progress = computed(() => [
  {
    name: "科学",
    icon: "rocket",
    value: Math.floor(nation.value.space.distance),
    max: 50,
    description: nation.value.space.launched ? `系外行星远征 · 每回合 ${nation.value.space.speed} 光年` : "卫星 → 登月 → 火星 → 系外行星远征（50光年）",
  },
  {
    name: "文化",
    icon: "culture",
    value: foreignTourists(state.value,0),
    max: cultureTarget(state.value,0),
    description: "来访游客须超过每个其他文明的国内游客",
  },
  {
    name: "征服",
    icon: "sword",
    value: state.value.cities.filter((c) => c.capital >= 0 && c.owner === 0)
      .length,
    max: majorNations.value.length,
    description: "占领所有文明的原始首都",
  },
  {
    name: "宗教",
    icon: "faith",
    value: majorIds(state.value).filter((o) => {
      const cs = ownCities(state.value, o);
      return (
        cs.length > 0 &&
        cs.filter((c) => c.religion === 0).length > cs.length / 2
      );
    }).length,
    max: majorNations.value.length,
    description: "创立宗教，使每个文明过半城市信奉它",
  },
]);
const scoreScale = computed(() =>
    Math.max(100, ...state.value.history.flatMap((h) => h.scores)),
  ),
  chartLine = (o: number) =>
    state.value.history
      .map(
        (h, i) =>
          `${25 + (i * 550) / Math.max(1, state.value.history.length - 1)},${170 - (h.scores[o] / scoreScale.value) * 140}`,
      )
      .join(" ");
const tabs = [
  ["地图", "globe"],
  ["城市", "city"],
  ["科技", "science"],
  ["市政", "culture"],
  ["政体", "scroll"],
  ["外交", "trade"],
  ["信仰", "faith"],
  ["进度", "rocket"],
  ["存档", "save"],
  ["帮助", "help"],
];
</script>

<template>
  <Teleport to="body" :disabled="!expanded">
    <section class="civ-game" :class="{ expanded }" :aria-busy="turnBusy">
      <div :inert="dialogs || turnBusy">
        <header class="civ-header">
          <div class="brand-mark"><CivIcon name="compass" :size="38" /></div>
          <div class="civ-brand">
            <h1>文明 · 六角世界</h1>
          </div>
          <div class="nation-banner">
            <span :style="{ color: nation.color }">{{ nation.name }}</span
            ><small>{{ civ.leader }} · {{ eras[era(nation)] }}</small>
          </div>
          <div class="turn-counter">
            <strong>{{ state.turn }}<small>回合</small></strong
            ><span>{{ year }}</span>
          </div>
          <button class="expand-game" @click="expanded = !expanded">
            {{ expanded ? "收起游戏" : "展开游戏" }}
          </button>
        </header>
        <div class="empire-resources">
          <div
            v-for="key in ['science', 'culture', 'gold', 'faith'] as YieldKey[]"
            :key="key"
            :class="key"
          >
            <CivIcon :name="key" :size="22" /><span
              ><small>{{ yieldNames[key] }}</small
              ><strong>{{
                key === "gold" || key === "faith"
                  ? Math.floor(nation[key])
                  : output[key].toFixed(1)
              }}</strong></span
            ><em>{{
              key === "gold" || key === "faith"
                ? (output[key] >= 0 ? "+" : "") +
                  output[key].toFixed(1) +
                  "/回合"
                : "每回合"
            }}</em>
          </div>
          <div>
            <CivIcon name="city" :size="22" /><span
              ><small>帝国</small
              ><strong
                >{{ cities.length }} 城 ·
                {{ cities.reduce((v, c) => v + c.pop, 0) }} 人</strong
              ></span
            >
          </div>
        </div>
        <nav class="civ-nav" aria-label="游戏面板">
          <button
            v-for="[label, icon] in tabs"
            :key="label"
            :class="{ selected: tab === label }"
            :aria-pressed="tab === label"
            @click="tab = label"
          >
            <CivIcon :name="icon" :size="17" />{{ label
            }}<span
              v-if="label === '城市' && todo.cities.length"
              class="badge"
              >{{ todo.cities.length }}</span
            >
          </button>
        </nav>
        <div v-if="state.winner" class="victory-banner">
          <CivIcon
            :name="state.winner.type === 'defeat' ? 'shield' : 'wonder'"
            :size="32"
          />
          <div>
            <h2>
              {{
                state.winner.type === "defeat"
                  ? "文明覆灭"
                  : state.nations[state.winner.owner].name +
                    " · " +
                    victoryNames[state.winner.type]
              }}
            </h2>
            <p>第 {{ state.turn }} 回合 · {{ score(state, 0) }} 分</p>
          </div>
          <button v-if="!state.continued" @click="state.continued = true">
            继续游玩</button
          ><button @click="newSetup">新世界</button>
        </div>
        <div v-if="tab === '地图'" class="map-layout">
          <div class="map-column">
            <div class="research-strips">
              <button @click="tab = '科技'">
                <CivIcon name="science" />
                <div>
                  <small>科技</small
                  ><strong>{{ currentTech?.name ?? "研究完成" }}</strong>
                </div>
                <span
                  >{{
                    Math.floor(nation.researchProgress[nation.research] ?? 0)
                  }}
                  已投入</span
                ></button
              ><button @click="tab = '市政'">
                <CivIcon name="culture" />
                <div>
                  <small>市政</small
                  ><strong>{{ currentCivic?.name ?? "研究完成" }}</strong>
                </div>
                <span
                  >{{
                    Math.floor(nation.researchProgress[nation.culture] ?? 0)
                  }}
                  已投入</span
                >
              </button>
            </div>
            <div v-if="placement" class="placement-banner">
              <span
                >放置 {{ info(placement.item).name }} · 地块显示邻接收益</span
              ><button @click="placement = null">取消</button>
            </div>
            <HexWorld
              :state="state"
              :selected="selection"
              :unit="unit"
              :mode="mode"
              :placement="placement"
              :focus="focus"
              :focus-tick="focusTick"
              @select="select"
              @hover="hover = $event"
            />
            <div class="map-below">
              <div>
                <h3>待办</h3>
                <div class="todo-list">
                  <button
                    v-if="todo.cities.length"
                    @click="locate(todo.cities[0].tile)"
                  >
                    <CivIcon name="production" :size="16" />{{
                      todo.cities.length
                    }}
                    城待安排生产</button
                  ><button
                    v-if="todo.units.length"
                    @click="locateUnit(todo.units[0].id)"
                  >
                    <CivIcon name="flag" :size="16" />{{
                      todo.units.length
                    }}
                    单位可行动</button
                  ><span v-if="!todo.cities.length && !todo.units.length"
                    >已准备进入下一回合</span
                  >
                </div>
              </div>
              <div class="recent-events">
                <h3>最近消息</h3>
                <p v-for="e in state.log.slice(0, 3)" :key="e.turn + e.text">
                  <span>{{ e.turn }}</span
                  >{{ e.text }}
                </p>
              </div>
            </div>
          </div>
          <aside class="world-inspector">
            <div class="tile-caption">
              <CivIcon
                :name="
                  tile.terrain === 'mountain'
                    ? 'mountain'
                    : tile.terrain === 'forest'
                      ? 'tree'
                      : tile.terrain === 'water'
                        ? 'water'
                        : 'compass'
                "
              /><strong>{{
                tile.seen ? terrainNames[tile.terrain] : "未探索"
              }}</strong
              ><span>{{ tile.q }}, {{ tile.r }}</span>
            </div>
            <p v-if="tile.seen" class="tile-description">
              {{ tile.river ? "淡水河流 · " : ""
              }}{{
                resourceVisible(nation, tile)
                  ? (resources[tile.resource]?.name ?? "")
                  : ""
              }}{{
                tile.owner >= 0
                  ? " · " + state.nations[tile.owner].name + "领土"
                  : " · 未占领土地"
              }}
            </p>
            <div v-if="unit && city" class="inspector-tabs">
              <button
                :class="{ selected: inspect === '单位' }"
                @click="inspect = '单位'"
              >
                单位</button
              ><button
                :class="{ selected: inspect === '城市' }"
                @click="
                  inspect = '城市';
                  mode = 'inspect';
                "
              >
                城市
              </button>
            </div>
            <CityPanel
              v-if="city && (!unit || inspect === '城市')"
              :state="state"
              :city="city"
              @place="place(city, $event)"
              @status="tell"
              @focus="locate"
            />
            <UnitPanel
              v-else-if="unit"
              :state="state"
              :unit="unit"
              :mode="mode"
              :target="previewTarget"
              :confirmed-target="attackTarget !== null"
              @mode="setMode"
              @status="tell"
              @attack="confirmAttack"
            />
            <div v-else class="empty-inspector">
              <template v-if="viewedUnit"
                ><CivIcon :name="info(viewedUnit.type).icon" :size="40" />
                <h2>{{ info(viewedUnit.type).name }}</h2>
                <p>
                  {{ state.nations[viewedUnit.owner].name }} · 生命
                  {{ Math.round(viewedUnit.hp) }}
                </p>
                <button
                  v-if="viewedUnit.owner > 0 && state.nations[viewedUnit.owner].kind !== 'barbarian'"
                  @click="tab = '外交'"
                >
                  查看外交关系
                </button></template
              ><template v-else-if="selectedCity && tile.seen"
                ><CivIcon name="city" :size="40" />
                <h2>{{ selectedCity.name }}</h2>
                <p>
                  {{ state.nations[selectedCity.owner].name }} · 人口
                  {{ selectedCity.pop }}
                </p>
                <p>
                  城市生命 {{ Math.round(selectedCity.hp) }} · 城墙
                  {{ Math.round(selectedCity.walls) }}
                </p></template
              ><template v-else
                ><CivIcon name="compass" :size="40" />
                <h2>{{ tile.seen ? "选择单位或城市" : "世界仍在迷雾中" }}</h2>
                <p>
                  点选单位移动，点选城市安排生产。
                </p></template
              >
            </div>
            <button
              v-if="city && city.walls > 0"
              :disabled="city.attacked || !active(state)"
              @click="
                mode = mode === 'cityAttack' ? 'inspect' : 'cityAttack';
                tell('点击两格内的敌军进行城市远程攻击');
              "
              class="wide"
            >
              城市远程攻击
            </button>
            <button
              v-if="!unit && !city && tile.owner < 0 && nearCity && tile.seen"
              :disabled="!nation.civic.includes('empire') || !active(state)"
              @click="
                tell(
                  buyTile(state, nearCity, selection)
                    ? '已购买地块'
                    : '地块不相连或金币不足',
                )
              "
              class="wide"
            >
              为 {{ nearCity.name }} 购买此地块
            </button>
            <button
              v-if="mode !== 'inspect'"
              class="wide subtle"
              @click="
                mode = 'inspect';
                attackTarget = null;
              "
            >
              取消{{ mode === "move" ? "移动" : "攻击" }}
            </button>
          </aside>
        </div>
        <main v-else class="civ-panel-content">
          <ResearchTree
            v-if="tab === '科技' || tab === '市政'"
            :state="state"
            :civic="tab === '市政'"
            @choose="
              (id) => {
                if (active(state)) {
                  nation[tab === '市政' ? 'culture' : 'research'] = id;
                  tell('研究方向已切换，原进度保留');
                }
              }
            "
          />
          <template v-else-if="tab === '城市'"
            ><div class="page-heading">
              <div>
                <p class="kicker">EMPIRE</p>
                <h2>城市总览</h2>
              </div>
              <span
                >{{ cities.length }} 座城市 ·
                {{ cities.reduce((v, c) => v + c.pop, 0) }} 人口</span
              >
            </div>
            <div class="city-overview">
              <article v-for="c in cities" :key="c.id">
                <div class="overview-title">
                  <CivIcon name="city" :size="28" />
                  <div>
                    <h3>{{ c.name }}</h3>
                    <p>
                      {{ c.capital >= 0 ? "首都 · " : "" }}人口 {{ c.pop }} ·
                      住房
                      {{ yields(state, c).housing }}
                    </p>
                  </div>
                  <button @click="locate(c.tile)">管理</button>
                </div>
                <div class="overview-yields">
                  <span
                    v-for="k in [
                      'food',
                      'production',
                      'science',
                      'culture',
                    ] as YieldKey[]"
                    :key="k"
                    ><CivIcon :name="k" :size="16" />{{
                      yields(state, c)[k].toFixed(1)
                    }}</span
                  >
                </div>
                <div v-if="c.queue[0]" class="overview-production">
                  <strong>{{ info(c.queue[0].item).name }}</strong
                  ><span
                    >{{ Math.floor(c.invested[jobKey(c.queue[0])] ?? 0) }} /
                    {{ jobCost(state, c, c.queue[0]) }}</span
                  >
                  <div class="meter">
                    <i
                      :style="{
                        width:
                          Math.min(
                            100,
                            ((c.invested[jobKey(c.queue[0])] ?? 0) /
                              jobCost(state, c, c.queue[0])) *
                              100,
                          ) + '%',
                      }"
                    />
                  </div>
                </div>
                <p v-else class="warning">尚未安排生产</p>
                <p class="hint" v-if="yields(state, c).happy < -1">
                  宜居度不足，产出降低
                </p>
              </article>
            </div>
            <div v-if="!cities.length" class="empty-page">
              <CivIcon name="flag" :size="60" />
              <h3>还没有城市</h3>
              <button
                @click="
                  locateUnit(
                    state.units.find(
                      (u) => u.owner === 0 && u.type === 'settler',
                    )?.id ?? -1,
                  )
                "
              >
                找到开拓者
              </button>
            </div>
            <h3>军队与民用单位</h3>
            <div class="unit-roster">
              <button
                v-for="u in state.units.filter((u) => u.owner === 0)"
                :key="u.id"
                @click="locateUnit(u.id)"
              >
                <CivIcon :name="info(u.type).icon" />
                <div>
                  <strong>{{ scientistById(u.person)?.name ?? info(u.type).name }}</strong
                  ><small
                    >生命 {{ Math.round(u.hp) }} ·
                    {{ u.fortified ? "驻守中" : u.moves + " 移动力" }}</small
                  >
                </div>
                <span>#{{ u.id }}</span>
              </button>
            </div></template
          >
          <template v-else-if="tab === '政体'"
            ><div class="page-heading">
              <div>
                <p class="kicker">GOVERNMENT</p>
                <h2>政体与政策</h2>
              </div>
            </div>
            <div class="government-toolbar">
              <label for="government-choice">政体</label>
              <select id="government-choice" v-model="governmentDraft" @change="governmentChange">
                <option v-for="g in governments" :key="g.id" :value="g.id" :disabled="!nation.civic.includes(g.unlock)">{{ g.name }}{{ nation.civic.includes(g.unlock) ? '' : '（未解锁）' }}</option>
              </select>
              <span>{{ draftGov.slots.length }} 槽</span>
              <CivHelp label="政体效果" :text="draftGov.description + (draftGov.pending ? '\n暂未接入 ' + draftGov.pending : '')" />
              <CivHelp label="政策规则" text="新市政完成后可免费换卡。卡片按类型入槽，通配槽不限类型；淘汰的卡会移除。" />
            </div>
            <div class="policy-slots">
              <div v-for="(slot,index) in draftGov.slots" :key="index" :class="slot">
                <div class="policy-slot-title">
                  <label :for="`policy-slot-${index}`">{{ policyTypeNames[slot] }} {{ index + 1 }}</label>
                  <CivHelp v-if="policyDraft[index]" :label="`政策效果 ${index+1}`" :text="policies.filter(p=>p[0]===policyDraft[index]).map(p=>`${p[1]}：${p[4]}`).join('')" />
                </div>
                <select :id="`policy-slot-${index}`" v-model="policyDraft[index]" :aria-label="`${policyTypeNames[slot]}政策槽 ${index+1}`">
                  <option :value="null">空槽</option>
                  <option v-for="p in policies.filter(p=>policyAvailable({...nation,government:governmentDraft},p[0]) && (slot==='wild'||p[3]===slot))" :key="p[0]" :value="p[0]" :disabled="policyDraft.includes(p[0]) && policyDraft[index]!==p[0]">{{ p[1] }}</option>
                </select>
              </div>
            </div>
            <div class="policy-actions">
              <button class="primary" @click="applyPolicies" :disabled="!active(state)">应用</button>
              <span>{{ nation.policyFree ? '免费' : '40 金币' }}</span>
            </div>
            <details class="government-reference">
              <summary>全部政体 <span>{{ governments.length }}</span></summary>
              <div class="government-grid">
              <button
                v-for="g in governments"
                :key="g.id"
                :disabled="!nation.civic.includes(g.unlock)"
                :class="{ selected: governmentDraft === g.id }"
                @click="
                  governmentDraft = g.id;
                  governmentChange();
                "
              >
                <CivIcon name="scroll" :size="24" /><strong>{{
                  g.name
                }}</strong>
                <p>{{ g.description }}</p>
                <small
                  >{{ g.slots.length }} 政策槽 ·
                  {{ civics.find((c) => c.id === g.unlock)?.name }}</small
                >
              </button>
              </div>
            </details></template
          >
          <template v-else-if="tab === '外交'"
            ><div class="page-heading">
              <div>
                <p class="kicker">DIPLOMACY</p>
                <h2>文明与城邦</h2>
              </div>
              <span>使者 {{ nation.envoys }} · 影响力 {{ (nation.influence ?? 0).toFixed(0) }} / {{ Math.ceil(influenceRate(nation).threshold * (state.options.speed==='normal'?1:2/3)) }}</span>
            </div>
            <div class="diplomacy-grid">
              <article
                v-for="(n, o) in majorNations.slice(1)"
                :key="n.name"
                :style="{ '--nation-color': n.color }"
              >
                <div class="card-title diplomatic-title"><CivIcon name="flag" :size="24" /><h3>{{ nation.met.includes(o + 1) ? n.name : "尚未遇见" }}</h3></div>
                <template v-if="nation.met.includes(o + 1)"
                  ><p>
                    {{
                      relation(state, 0, o + 1).status === "war"
                        ? "交战"
                        : relation(state, 0, o + 1).status === "friend"
                          ? "友好"
                          : "和平"
                    }}
                    · 好感 {{ relation(state, 0, o + 1).opinion }}
                  </p>
                  <p>
                    {{ ownCities(state, o + 1).length }} 座城市 ·
                    {{ eras[era(n)] }} · {{ n.tech.length }} 科技
                  </p>
                  <p>AI 偏好 · {{ aiStrategyNames[aiStrategy(n,o+1)] }}</p>
                  <div class="diplomatic-actions">
                    <button
                      :disabled="
                        relation(state, 0, o + 1).delegation ||
                        relation(state, 0, o + 1).status === 'war' ||
                        nation.gold < 25 ||
                        !active(state)
                      "
                      @click="diplomat(o + 1, 'delegate')"
                    >
                      代表团 · 25 金</button
                    ><button
                      :disabled="
                        relation(state, 0, o + 1).status !== 'peace' ||
                        relation(state, 0, o + 1).opinion < 10 ||
                        !active(state)
                      "
                      @click="diplomat(o + 1, 'friend')"
                    >
                      宣布友谊</button
                    ><button
                      v-if="relation(state, 0, o + 1).status !== 'war'"
                      class="danger"
                      :disabled="
                        relation(state, 0, o + 1).status === 'friend' ||
                        state.turn < relation(state, 0, o + 1).until ||
                        !active(state)
                      "
                      @click="diplomat(o + 1, 'war')"
                    >
                      宣战</button
                    ><button
                      v-else
                      :disabled="
                        state.turn - relation(state, 0, o + 1).since < 8 ||
                        !active(state)
                      "
                      @click="diplomat(o + 1, 'peace')"
                    >
                      谈判和平
                    </button>
                  </div></template
                >
              </article>
              <article v-for="cs in state.cityStates" :key="cs.owner">
                <div class="card-title diplomatic-title">
                <h3>
                  {{
                    nation.met.includes(cs.owner)
                      ? state.nations[cs.owner].name
                      : "未知城邦"
                  }}
                </h3>
                <CivHelp v-if="nation.met.includes(cs.owner)" :label="`城邦使者收益 ${cs.owner}`" :text="cityStateHelp(cs.type) + '\n宗主：至少3使者且独占最多。' + (cityStateRoster.find(row=>row.name===state.nations[cs.owner].name)?.bonus ?? '')" />
                </div>
                <template v-if="nation.met.includes(cs.owner)">
                <p>
                  {{ cityStateTypes[cs.type] }}城邦 · 使者
                  {{ cs.envoys[0] }}
                  · 宗主 {{ suzerain(state,cs)===null ? '无' : state.nations[suzerain(state,cs)!].name }}
                </p>
                <button
                  :disabled="
                    !nation.envoys ||
                    !nation.met.includes(cs.owner) ||
                    !ownCities(state, cs.owner).length ||
                    atWar(state,0,cs.owner) ||
                    !active(state)
                  "
                  @click="
                    tell(
                      sendEnvoy(state, cs.owner)
                        ? '使者已派遣'
                        : '暂时无法派遣',
                    )
                  "
                >
                  派遣一名使者
                </button>
                </template>
              </article>
            </div>
            <h3>
              贸易路线 ·
              {{ state.routes.filter((r) => r.owner === 0).length }} /
              {{ tradeCapacity(state) }}
            </h3>
            <div class="route-list">
              <article
                v-for="r in state.routes.filter((r) => r.owner === 0)"
                :key="r.id"
              >
                <CivIcon name="trade" /><strong
                  >{{ state.cities.find((c) => c.id === r.from)?.name }} →
                  {{ state.cities.find((c) => c.id === r.to)?.name }}</strong
                ><span>剩余 {{ r.remaining }} 回合</span>
              </article>
              <p v-if="!state.routes.some((r) => r.owner === 0)" class="hint">
                先完成对外贸易，再用商人在城市中建立路线。
              </p>
            </div></template
          >
          <template v-else-if="tab === '信仰'"
            ><div class="page-heading">
              <div>
                <p class="kicker">FAITH & GREAT PEOPLE</p>
                <h2>信仰与伟人</h2>
              </div>
              <span
                >{{ Math.floor(nation.faith) }} 信仰 · +{{
                  output.faith.toFixed(1)
                }}
                / 回合</span
              >
            </div>
            <div class="faith-layout">
              <article class="faith-card">
                <div class="card-title">
                  <CivIcon name="faith" :size="24" />
                  <h3>{{ nation.religion || "尚未创立宗教" }}</h3>
                  <CivHelp label="本版宗教规则" text="先招募大预言家，再在圣地创教；须有万神殿，不额外消耗信仰。信条全局独占。预言家费用暂按古典基础计算，压力与信徒换算仍简化；完整伟人池、信条扩展和神学战待补。" />
                </div>
                <template v-if="!nation.religion">
                <div class="meter">
                  <i
                    :style="{
                      width:
                        Math.min(100, (nation.great.prophet / prophetCost(state)) * 100) + '%',
                    }"
                  />
                </div>
                <p>{{ Math.floor(nation.great.prophet) }} / {{ prophetCost(state) }} 预言家点 · 宗教 {{ majorNations.filter(n=>n.religion || n.prophetRecruited).length }} / {{ religionLimit(state) }}</p>
                <button v-if="!nation.prophetRecruited && !nation.religion"
                  :disabled="nation.great.prophet < prophetCost(state) || majorNations.filter(n=>n.religion || n.prophetRecruited).length>=religionLimit(state) || !cities.some(c=>c.buildings.includes('holy')) || !active(state)"
                  @click="tell(recruitProphet(state)?'大预言家已招募':'需要预言家点、圣地和空闲地块')">招募大预言家</button>
                <div class="setup-fields belief-fields">
                  <label>信徒信条<select v-model="followerBelief" aria-label="信徒信条"><option value="">请选择</option><option v-for="b in availableBeliefs(state,'follower')" :key="b.id" :value="b.id">{{ b.name }}</option></select></label>
                  <label>创始人信条<select v-model="founderBelief" aria-label="创始人信条"><option value="">请选择</option><option v-for="b in availableBeliefs(state,'founder')" :key="b.id" :value="b.id">{{ b.name }}</option></select></label>
                </div>
                <div class="button-row">
                  <CivHelp v-if="followerBelief" label="信徒信条效果" :text="beliefs.find(b=>b.id===followerBelief)?.description ?? ''" />
                  <CivHelp v-if="founderBelief" label="创始人信条效果" :text="beliefs.find(b=>b.id===founderBelief)?.description ?? ''" />
                </div>
                <button
                  :disabled="
                    !!nation.religion ||
                    !nation.pantheon || !religionCity(state) || !followerBelief || !founderBelief ||
                    !availableBeliefs(state,'follower').some(b=>b.id===followerBelief) || !availableBeliefs(state,'founder').some(b=>b.id===founderBelief) ||
                    !active(state)
                  "
                  @click="
                    tell(
                      foundReligion(state,0,[followerBelief,founderBelief])
                        ? '宗教已创立'
                        : '需要万神殿、圣地中的大预言家和未被选择的信条',
                    )
                  "
                >
                  创立宗教
                </button>
                </template>
                <div v-if="nation.religion" class="religion-beliefs">
                  <div v-for="id in nation.beliefs ?? []" :key="id">{{ beliefs.find(b=>b.id===id)?.name }} <CivHelp :label="`信条 ${id}`" :text="beliefs.find(b=>b.id===id)?.description ?? ''" /></div>
                  <p v-if="!nation.beliefs?.length" class="hint">旧存档未记录信条。</p>
                </div>
                <h3>万神殿</h3>
                <p v-if="nation.pantheon">
                  {{
                    pantheons.find(p=>p.id===nation.pantheon)?.name
                  }}
                  <CivHelp label="万神殿效果" :text="pantheons.find(p=>p.id===nation.pantheon)?.description ?? ''" />
                </p>
                <div v-else class="pantheon-choices">
                  <div v-for="p in pantheons" :key="p.id">
                  <button
                    :disabled="nation.faith < 25 || state.nations.some(n=>n.pantheon===p.id) || !active(state)"
                    @click="pantheon(state, p.id)"
                  >
                    {{ p.name }} · 25</button><CivHelp :label="`${p.name}效果`" :text="p.description" />
                  </div>
                </div>
              </article>
              <div>
                <article class="great-card scientist-card">
                  <CivIcon name="science" :size="28" />
                  <div>
                    <h3>{{ currentScientist(state)?.name ?? '科学家名单已招募完' }}</h3>
                    <p v-if="currentScientist(state)">{{ eras[currentScientist(state)!.era] }} · {{ Math.floor(nation.great.science) }} / {{ scientistCost(state) }} 点</p>
                    <CivHelp v-if="currentScientist(state)" label="科学家能力" :text="currentScientist(state)!.description" />
                    <CivHelp label="科学家招募规则" :text="`所有文明争抢同一名单，招募后需移动单位使用能力。当前每回合 +${(cities.reduce((v,c)=>v+scientistPoints(state,c),0)+(hasPolicy(nation,'inspiration')?2*(nation.government==='republic'?1.15:1):0)).toFixed(1)} 点。现有 9 位早中期科学家；费用按时代基础值计算，世界时代溢价、跳过和赞助待补。`" />
                  </div>
                  <button :disabled="!currentScientist(state) || nation.great.science<scientistCost(state) || !cities.length || !active(state)" @click="tell(recruitScientist(state)?'科学家已就绪，前往地图使用能力':'暂时无法招募：点数不足或出生地被占')">招募科学家</button>
                </article>
                <article class="great-card">
                  <CivIcon name="culture" :size="28" />
                  <div>
                    <h3>大艺术家</h3>
                    <p>
                      {{ Math.floor(nation.great.culture) }} / 80 点 ·
                      获得 80 旅游与 60 文化
                    </p>
                  </div>
                  <button
                    :disabled="nation.great.culture < 80 || !active(state)"
                    @click="
                      tell(recruitArtist(state) ? '伟人已招募' : '点数不足')
                    "
                  >
                    招募
                  </button>
                </article>
                <article class="religious-cities">
                  <h3>城市信仰</h3>
                  <div
                    v-for="c in state.cities.filter(
                      (c) => state.tiles[c.tile].seen,
                    )"
                    :key="c.id"
                  >
                    <strong>{{ c.name }}</strong
                    ><span>{{
                      c.religion >= 0
                        ? state.nations[c.religion].religion
                        : "无主流信仰"
                    }}</span>
                  </div>
                </article>
              </div>
            </div></template
          >
          <template v-else-if="tab === '进度'"
            ><div class="page-heading">
              <div>
                <p class="kicker">VICTORY</p>
                <h2>胜利进度</h2>
              </div>
              <span>第 {{ turnLimit(state) }} 回合结算分数胜利</span>
            </div>
            <div class="victory-grid">
              <article v-for="p in progress" :key="p.name">
                <div class="victory-title"><CivIcon :name="p.icon" :size="22" /><h3>{{ p.name }}</h3><CivHelp :label="`${p.name}胜利条件`" :text="p.description" /></div>
                <strong>{{ p.value }} / {{ p.max }}</strong>
                <div class="meter">
                  <i
                    :style="{
                      width: Math.min(100, (p.value / p.max) * 100) + '%',
                    }"
                  />
                </div>
              </article>
            </div>
            <div class="score-chart">
              <h3>文明分数</h3>
              <div class="chart-legend">
                <span
                  v-for="(n, o) in majorNations"
                  :key="n.name"
                  :style="{ color: n.color }"
                  >{{ n.name }} {{ score(state, o) }}</span
                >
              </div>
              <svg
                v-if="state.history.length > 1"
                viewBox="0 0 600 190"
                role="img"
                aria-label="各文明的分数随回合变化"
              >
                <path
                  d="M25 20V170H580M25 100H580"
                  stroke="#556650"
                  fill="none"
                />
                <polyline
                  v-for="(n, o) in majorNations"
                  :key="n.name"
                  :points="chartLine(o)"
                  :stroke="n.color"
                  stroke-width="3"
                  fill="none"
                />
              </svg>
              <p v-else class="hint">每五回合记录一次分数。</p>
            </div>
            <h3>回合记录</h3>
            <div class="event-log">
              <p v-for="(e, i) in state.log" :key="i">
                <span>{{ e.turn }}</span
                ><CivIcon
                  :name="
                    e.kind === 'research'
                      ? 'science'
                      : e.kind === 'combat'
                        ? 'sword'
                        : e.kind === 'wonder'
                          ? 'wonder'
                          : 'scroll'
                  "
                  :size="16"
                />{{ e.text }}
              </p>
            </div></template
          >
          <template v-else-if="tab === '存档'"
            ><div class="page-heading">
              <div>
                <p class="kicker">LOCAL SAVE</p>
                <h2>存档与设置</h2>
              </div>
              <span>{{ savedMessage }}</span>
            </div>
            <div class="save-cards">
              <article>
                <div class="card-title"><CivIcon name="save" :size="24" /><h3>自动存档</h3><CivHelp label="存档位置与备份" text="操作后自动保存在这台设备的浏览器中。清理站点数据、换浏览器或域名会失去进度；导出 JSON 可备份或换设备继续。" /></div>
                <p>保存在这台设备，重要进度请导出备份。</p>
                <div class="button-row">
                  <button @click="exportSave">导出 JSON</button
                  ><button @click="file?.click()">导入存档</button>
                </div>
                <input
                  ref="file"
                  type="file"
                  accept=".json,application/json"
                  hidden
                  @change="importSave"
                />
              </article>
              <article>
                <div class="card-title"><CivIcon name="scroll" :size="24" /><h3>手动快照</h3><CivHelp label="快照说明" text="保留一个手动存档，自动存档不会覆盖它。再次保存快照会替换原快照；恢复前会要求确认。" /></div>
                <p>{{ manual }}</p>
                <div class="button-row">
                  <button @click="manualSave">保存当前快照</button
                  ><button
                    :disabled="manual === '暂无手动存档'"
                    @click="restoreConfirm = true"
                  >
                    恢复快照
                  </button>
                </div>
              </article>
              <article>
                <div class="card-title"><CivIcon name="globe" :size="24" /><h3>新游戏</h3><CivHelp label="新游戏设置" text="选择文明、地图、难度、速度和随机种子。建立新世界会替换自动存档，开始前会要求确认。" /></div>
                <p>重新开始前，记得备份当前进度。</p>
                <button class="primary" @click="newSetup">新游戏</button>
              </article>
            </div>
            <label class="setting-row"
              ><input
                v-model="warnUnfinished"
                type="checkbox"
              />结束回合前提醒未行动单位与空闲城市</label
            >
            <p class="hint">
              本局：{{
                state.options.size === "standard" ? "标准" : "紧凑"
              }}地图 ·
              {{ state.options.map === "pangaea" ? "盘古大陆" : "大陆" }} ·
              {{
                state.options.difficulty === "hard"
                  ? "挑战"
                  : state.options.difficulty === "relaxed"
                    ? "轻松"
                    : "标准"
              }}难度 ·
              {{ state.options.speed === "quick" ? "快速" : "普通" }}速度 · 种子
              {{ state.options.seed }}
            </p></template
          >
          <template v-else
            ><div class="page-heading">
              <div>
                <p class="kicker">FIELD GUIDE</p>
                <h2>怎么玩</h2>
              </div>
              <span>无需账户 · 无联网对局</span>
            </div>
            <div class="guide-grid">
              <article>
                <h3>01 · 建城与探索</h3>
                <p>
                  选中开拓者，点「建立城市」。选中其他单位，先点「移动」，再点蓝色地块。地图支持拖动与缩放；小地图显示已探索区域。
                </p>
                <p>
                  回合结束会重置移动力。驻守单位不会进入待办，点击唤醒可重新行动。
                </p>
              </article>
              <article>
                <h3>02 · 城市与土地</h3>
                <p>
                  城市生产单位、建筑、区域和奇观。最多五项排队，可调整顺序；移出队列不清除投入。人口
                  1 / 4 / 7 对应 1 / 2 / 3 个专业区域。
                </p>
                <p>
                  市民自动工作本城地块。建农场增粮、矿山增产；临河增加住房，奢侈资源与娱乐建筑提供宜居度。
                </p>
              </article>
              <article>
                <h3>03 · 两棵研究树</h3>
                <p>
                  科技消耗科学，市政消耗文化。选择节点，再点「开始研究」。切换不会把旧项目进度挪到新项目。
                </p>
                <p>
                  完成指定行动可触发尤里卡或鼓舞。市政解锁政体、政策与使者。
                </p>
              </article>
              <article>
                <h3>04 · 战争与和平</h3>
                <p>
                  遇见文明后可派代表团、宣布友谊或宣战。攻击模式会显示目标，点选后有伤害预览，再确认攻击。
                </p>
                <p>
                  丘陵、森林、驻守提供防御。进入敌军控制区会停止移动；远程单位不会受到即时反击。先打掉城墙，近战才能占城。
                </p>
              </article>
              <article>
                <h3>05 · 贸易与信仰</h3>
                <p>
                  商人在城市中心选目标，建立 24
                  回合路线并铺路。国内贸易提供粮食和生产，国际贸易提供金币。商业中心和港口增加容量。
                </p>
                <p>
                  圣地积累信仰与先知点。创立宗教后购买传教士，靠近城市传播；宗教也会向邻近城市缓慢扩散。
                </p>
              </article>
              <article>
                <h3>06 · 存档与边界</h3>
                <p>
                  进度保存在浏览器中，可在「存档」导出备份、保存快照或导入旧存档。
                </p>
                <p>
                  本版按文明 6《风云变幻》对齐。科技与市政数据已补齐，部分玩法仍未实现，尚未通过90%对齐验收。
                </p>
              </article>
            </div></template
          >
        </main>
        <footer class="turn-footer">
          <div class="footer-status">
            <span class="save-dot" /><span role="status" aria-live="polite">{{
              notice || savedMessage
            }}</span>
          </div>
          <button
            class="turn-button"
            :disabled="turnBusy || !active(state)"
            @click="endTurn()"
          >
            <span>{{ turnBusy ? "电脑回合…" : "下一回合" }}</span
            ><CivIcon name="arrow" />
          </button>
        </footer>
      </div>
      <div v-if="dialogs" class="civ-modal-backdrop">
        <section
          ref="modal"
          class="civ-modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="
            setup ? 'setup-title' : turnConfirm ? 'turn-title' : 'restore-title'
          "
          @keydown="modalKeys"
        >
          <template v-if="setup"
            ><div class="setup-heading">
              <CivIcon name="compass" :size="44" />
              <div>
                <p class="kicker">A NEW WORLD</p>
                <h2 id="setup-title">新游戏</h2>
              </div>
              <button
                v-if="started"
                class="icon-button"
                aria-label="关闭开局设置"
                @click="setup = false"
              >
                <CivIcon name="close" />
              </button>
            </div>
            <div class="setup-fields">
              <label>你的文明<select v-model="options.civilization" aria-label="你的文明">
                <option value="random">随机文明</option>
                <option v-for="c in civilizations" :key="c.id" :value="c.id">{{ c.name }} · {{ c.leader }}</option>
              </select></label>
              <label>AI 数量<select v-model.number="options.aiCount" aria-label="AI 数量">
                <option v-for="count in 5" :key="count" :value="count">{{ count }} 个对手</option>
              </select></label>
              <label>城邦数量<select v-model.number="options.cityStateCount" aria-label="城邦数量">
                <option v-for="count in [2,3,4,5,6]" :key="count" :value="count">{{ count }} 座{{ count===2?' · 政治哲学鼓舞不可达':'' }}</option>
              </select></label>
              <label
                >地图规模<select v-model="options.size">
                  <option value="standard">标准</option>
                  <option value="compact">紧凑</option>
                </select></label
              ><label
                >地图类型<select v-model="options.map">
                  <option value="continents">大陆 · 海湾与内海</option>
                  <option value="pangaea">盘古大陆 · 陆地相连</option>
                </select></label
              ><label
                >难度<select v-model="options.difficulty">
                  <option value="relaxed">轻松 · 少量蛮族</option>
                  <option value="standard">标准</option>
                  <option value="hard">挑战 · 积极对手</option>
                </select></label
              ><label
                >游戏速度<select v-model="options.speed">
                  <option value="quick">快速</option>
                  <option value="normal">标准</option>
                </select></label
              ><label class="seed-field"
                >随机种子<input
                  v-model="seedInput"
                  maxlength="80"
                  placeholder="留空随机；相同设置和种子复现开局"
              /></label>
            </div>
            <div class="setup-civilization-info">
              <CivIcon :name="setupCivilization?.id==='china'?'wonder':setupCivilization?.id==='rome'?'shield':setupCivilization?.id==='egypt'?'water':'compass'" :size="24" />
              <span>{{ setupCivilization ? setupCivilization.ability : '从华夏、罗马、埃及中随机选择' }}</span>
              <CivHelp label="开局设置说明" :text="(setupCivilization?.description ?? '随机文明在建立新世界时决定，固定设置和种子可以复现。') + '\n当前仅有三种文明；多个AI允许重复，以不同名称、颜色区分。4–5个AI时地图自动扩大。人数只能在新游戏中调整，旧存档不重排玩家。'" />
            </div>
            <p v-if="initial.error && !started" class="warning">
              {{ initial.error }}
            </p>
            <p v-if="started" class="warning">
              新游戏会覆盖自动存档。手动快照与旧版存档保留。
            </p>
            <div class="setup-actions">
              <button v-if="started" @click="setup = false">取消</button
              ><button class="primary" @click="startGame">
                建立新世界 <CivIcon name="arrow" />
              </button></div
          ></template>
          <template v-else-if="turnConfirm"
            ><h2 id="turn-title">还有事情没处理</h2>
            <p v-if="todo.cities.length">
              {{ todo.cities.map((c) => c.name).join("、") }} 暂未安排生产。
            </p>
            <p v-if="todo.units.length">
              还有 {{ todo.units.length }} 个单位可以行动。
            </p>
            <label class="setting-row"
              ><input v-model="warnUnfinished" type="checkbox" />继续提醒</label
            >
            <div class="button-row">
              <button
                @click="
                  turnConfirm = false;
                  if (todo.cities.length) locate(todo.cities[0].tile);
                  else if (todo.units.length) locateUnit(todo.units[0].id);
                "
              >
                去处理</button
              ><button class="primary" @click="endTurn(true)">
                直接结束回合
              </button>
            </div></template
          >
          <template v-else
            ><h2 id="restore-title">恢复手动存档？</h2>
            <p>{{ manual }}</p>
            <p>当前自动存档将被替换。可以取消后先导出。</p>
            <div class="button-row">
              <button @click="restoreConfirm = false">取消</button
              ><button class="primary" @click="manualRestore">确认恢复</button>
            </div></template
          >
        </section>
      </div>
      <div v-if="turnBusy" class="turn-overlay" role="status">
        <CivIcon name="globe" :size="38" />
        <p>其他文明正在行动…</p>
      </div>
    </section>
  </Teleport>
</template>
