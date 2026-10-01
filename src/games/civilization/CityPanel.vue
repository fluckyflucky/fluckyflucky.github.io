<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { State, City } from "./model";
import { items, yieldNames, type YieldKey } from "./catalog";
import {
  yields,
  workedTiles,
  tileYield,
  info,
  buildReason,
  enqueue,
  purchase,
  purchasePrice,
  jobKey,
  cost,
  jobCost,
  productionRate,
  active,
  growthCost,
  underSiege,
} from "./world";
import CivIcon from "./CivIcon.vue";
import CivHelp from './CivHelp.vue';
const props = defineProps<{ state: State; city: City }>();
const emit = defineEmits<{
  place: [string];
  status: [string];
  focus: [number];
}>();
const filter = ref("all"),
  showLocked = ref(false),
  view = ref("生产"),
  renaming = ref(false),
  name = ref("");
const categoryNames: Record<string, string> = {
  all: "全部",
  unit: "单位",
  building: "建筑",
  district: "区域",
  wonder: "奇观",
  project: "项目",
};
const output = computed(() => yields(props.state, props.city)),
  current = computed(() => props.city.queue[0]),
  done = computed(() => props.city.buildings.map(info)),
  worked = computed(() => workedTiles(props.state, props.city));
const choices = computed(() =>
  items
    .filter(
      (d) =>
        (filter.value === "all" || d.kind === filter.value) &&
        (!props.city.buildings.includes(d.id) || d.kind === "unit" || d.repeat),
    )
    .filter(
      (d) => showLocked.value || !buildReason(props.state, props.city, d.id),
    ),
);
function build(id: string) {
  if (buildReason(props.state, props.city, id)) return;
  const d = info(id);
  if (d.faithBuy) return;
  const placed=props.city.districtPlacements?.[id];
  if(placed!==undefined) {
    emit('status',enqueue(props.state,props.city,id,placed)?`继续建造：${d.name}`:'当前不能恢复建设');
    return;
  }
  if (["district", "wonder"].includes(d.kind)) emit("place", id);
  else
    emit(
      "status",
      enqueue(props.state, props.city, id)
        ? `已加入队列：${d.name}`
        : "生产队列已满",
    );
}
function buy(id: string) {
  emit(
    "status",
    purchase(props.state, props.city, id)
      ? `${info(id).name}已购买`
      : "资源、金币或出生地块不足",
  );
}
function rename() {
  const text = name.value.trim();
  if (text && active(props.state)) {
    props.city.name = text.slice(0, 32);
    renaming.value = false;
  }
}
watch(
  () => props.city.id,
  () => {
    view.value = "生产";
    renaming.value = false;
  },
);
</script>
<template>
  <section class="city-panel">
    <div class="inspector-title">
      <CivIcon name="city" :size="30" />
      <div>
        <small>{{ city.capital === 0 ? "首都" : "城市" }}</small>
        <h2>{{ city.name }}</h2>
      </div>
      <button
        class="icon-button"
        @click="
          renaming = !renaming;
          name = city.name;
        "
        aria-label="修改城市名称"
      >
        <CivIcon name="scroll" :size="18" />
      </button>
    </div>
    <form v-if="renaming" class="rename" @submit.prevent="rename">
      <input v-model="name" maxlength="32" aria-label="城市名称" /><button>
        确定
      </button>
    </form>
    <div class="city-summary">
      <div>
        <strong>{{ city.pop }}</strong
        ><span>人口</span>
      </div>
      <div>
        <strong>{{ output.housing }}</strong
        ><span>住房</span>
      </div>
      <div>
        <strong :class="{ warning: output.happy < -1 }"
          >{{ output.amenities }} / {{ output.requiredAmenities }}</strong
        ><span>宜居度 · {{ output.happiness }}</span>
      </div>
      <div>
        <strong>{{ Math.round(city.hp) }}</strong
        ><span>生命 / 200<template v-if="city.buildings.includes('walls')"> · 墙 {{ Math.round(city.walls) }}</template></span>
      </div>
    </div>
    <div class="growth">
      <div>
        <span>人口增长</span>
        <CivHelp label="城市增长规则" :text="`每人口消耗2粮食。住房至少多2时正常增长，多1时减半，不足时仅25%，超出5时停长；半点住房向下取整。宜居度需求每2人口1点（向上取整），本城${output.happiness}。奢侈品按城市缺口自动分配，每种最多4城，同种重复不叠加。`" />
        <span>{{ Math.floor(city.food) }} / {{ growthCost(state,city) }}</span>
      </div>
      <div class="meter">
        <i
          :style="{
            width: Math.min(100, (city.food / growthCost(state,city)) * 100) + '%',
          }"
        />
      </div>
      <small v-if="output.growing > 0"
        >预计
        {{ Math.max(1,Math.ceil((growthCost(state,city) - city.food) / output.growing)) }} 回合 ·
        每回合 +{{ output.growing.toFixed(1) }} 储粮</small
      ><small v-else class="warning">{{
        output.food < city.pop * 2
          ? "粮食短缺：调整市民焦点或建农场"
          : city.pop >= Math.floor(output.housing)+5 ? "住房不足，人口停止增长"
          : output.happy <= -6 ? "城市动荡，人口停止增长"
          : "粮食收支平衡，暂不增长"
      }}</small>
    </div>
    <div v-if="city.hp<200 || city.buildings.includes('walls')" class="city-defense-status">
      <small>{{ underSiege(state,city) ? '被围城：停止回血' : '补给畅通：生命 +10 / 回合' }}</small>
      <CivHelp label="围城与城墙维修" text="周围所有可通行地块都被敌方军队占据或控制才算围城；山脉不提供补给，沿海城市还需封锁水路。城墙不自动回血，连续3回合未遭攻击后，在生产·项目中修复外部防御。河流边的控制阻隔尚未实现。" />
    </div>
    <div class="city-yields">
      <span
        v-for="key in [
          'food',
          'production',
          'gold',
          'science',
          'culture',
          'faith',
        ] as YieldKey[]"
        :key="key"
        :title="yieldNames[key]"
        ><CivIcon :name="key" :size="16" />{{ output[key].toFixed(1) }}</span
      >
    </div>
    <div class="inspector-tabs">
      <button
        v-for="label in ['生产', '市民', '建筑']"
        :key="label"
        :class="{ selected: view === label }"
        @click="view = label"
      >
        {{ label }}
      </button>
    </div>
    <template v-if="view === '生产'">
      <div class="queue-head">
        <h3>
          生产队列 <small>{{ city.queue.length }} / 5</small>
        </h3>
        <span v-if="!current" class="warning">需要安排生产</span>
      </div>
      <ol class="production-queue">
        <li
          v-for="(job, index) in city.queue"
          :key="`${index}-${job.item}-${job.tile}`"
        >
          <div class="queue-number">{{ index + 1 }}</div>
          <div class="queue-description">
            <strong>{{ info(job.item).name }}</strong
            ><small
              >{{ Math.floor(city.invested[jobKey(job)] ?? 0) }} /
              {{ jobCost(state, city, job) }} ·
              {{
                Math.max(
                  1,
                  Math.ceil(
                    (jobCost(state, city, job) -
                      (city.invested[jobKey(job)] ?? 0)) /
                      productionRate(state, city, job.item),
                  ),
                )
              }}
              回合</small
            >
            <div class="meter">
              <i
                :style="{
                  width:
                    Math.min(
                      100,
                      ((city.invested[jobKey(job)] ?? 0) /
                        jobCost(state, city, job)) *
                        100,
                    ) + '%',
                }"
              />
            </div>
            <small
              v-if="buildReason(state, city, job.item, true)"
              class="warning"
              >{{ buildReason(state, city, job.item, true) }}</small
            >
          </div>
          <div class="queue-actions">
            <button
              v-if="index > 0"
              class="icon-button"
              :disabled="!active(state)"
              :aria-label="`提前生产${info(job.item).name}`"
              @click="
                city.queue.splice(index - 1, 0, city.queue.splice(index, 1)[0])
              "
            >
              ↑</button
            ><button
              class="icon-button"
              :disabled="!active(state)"
              :aria-label="`移出队列${info(job.item).name}`"
              @click="
                city.queue.splice(index, 1);
                emit('status', '项目投入已保留，可重新加入');
              "
            >
              <CivIcon name="close" :size="16" />
            </button>
          </div>
        </li>
      </ol>
      <div class="build-filters">
        <select v-model="filter" aria-label="生产分类">
          <option v-for="(label, key) in categoryNames" :key="key" :value="key">
            {{ label }}
          </option></select
        ><label><input v-model="showLocked" type="checkbox" />显示未解锁</label>
      </div>
      <div class="build-catalog">
        <article
          v-for="d in choices"
          :key="d.id"
          :class="{ unavailable: !!buildReason(state, city, d.id) }"
        >
          <div class="build-heading">
            <CivIcon :name="d.icon" :size="22" /><strong>{{ d.name }}</strong
            ><small>{{ categoryNames[d.kind] }}</small>
          </div>
          <p>{{ d.description }}</p>
          <div class="build-price">
            <small v-if="!d.faithBuy"
              >{{ cost(state, d.id, city) }} 生产 ·
              {{
                Math.ceil(cost(state, d.id, city) / productionRate(state, city, d.id))
              }}
              回合</small
            ><small v-else>仅信仰购买 · {{ purchasePrice(state, city, d.id) }}</small
            ><small v-if="d.resource"
              >需要 10
              {{
                d.resource === "iron"
                  ? "铁"
                  : d.resource === "horses"
                    ? "马"
                    : d.resource === "coal"
                      ? "煤"
                      : "石油"
              }}</small
            >
          </div>
          <p v-if="buildReason(state, city, d.id)" class="lock-reason">
            {{ buildReason(state, city, d.id) }}
          </p>
          <div v-else class="build-buttons">
            <button
              v-if="!d.faithBuy"
              :disabled="city.queue.length >= 5 || !active(state)"
              @click="build(d.id)"
            >
              {{
                ["district", "wonder"].includes(d.kind)
                  ? city.districtPlacements?.[d.id]!==undefined ? '继续建设' : "选择地块"
                  : "加入队列"
              }}</button
            ><button
              v-if="d.kind === 'building' || d.kind === 'unit'"
              :disabled="
                !active(state) ||
                state.nations[city.owner][d.faithBuy ? 'faith' : 'gold'] <
                  purchasePrice(state, city, d.id)
              "
              @click="buy(d.id)"
            >
              {{ d.faithBuy ? "信仰" : "金币" }}
              {{ purchasePrice(state, city, d.id) }}
            </button>
          </div>
        </article>
        <p v-if="!choices.length" class="empty">这类项目暂无可建内容。</p>
      </div>
    </template>
    <template v-else-if="view === '市民'"
      ><label class="focus-label"
        >市民焦点<select v-model="city.focus" :disabled="!active(state)">
          <option value="balanced">均衡发展</option>
          <option value="food">优先粮食</option>
          <option value="production">优先生产</option>
          <option value="gold">优先金币</option>
        </select></label
      >
      <p class="hint">
        城市中心不消耗市民；每位市民自动工作一块本城领土。同一地块不会被两城重复使用。
      </p>
      <div class="worked-tiles">
        <button v-for="i in worked" :key="i" @click="emit('focus', i)">
          <span>{{ state.tiles[i].q }}, {{ state.tiles[i].r }}</span
          ><span
            ><CivIcon name="food" :size="14" />{{
              tileYield(state, state.tiles[i], city.owner).food
            }}<CivIcon name="production" :size="14" />{{
              tileYield(state, state.tiles[i], city.owner).production
            }}<CivIcon name="gold" :size="14" />{{
              tileYield(state, state.tiles[i], city.owner).gold
            }}</span
          >
        </button>
      </div>
      <p class="hint">
        粮食消耗 {{ city.pop * 2 }} /
        回合。住房接近上限会减慢增长，宜居度不足会降低产出。
      </p></template
    >
    <template v-else
      ><h3>建成的区域与建筑</h3>
      <div class="completed-buildings">
        <article v-for="d in done" :key="d.id">
          <CivIcon :name="d.icon" :size="22" />
          <div>
            <strong>{{ d.name }}</strong>
            <p>{{ d.description }}</p>
          </div>
        </article>
      </div>
      <p v-if="!done.length" class="empty">还没有建筑。</p>
      <p class="hint">
        专业区域容量：{{
          city.buildings.filter(
            (id) =>
              info(id).kind === "district" &&
              !["spaceport", "neighborhood"].includes(id),
          ).length
        }}
        / {{ 1 + Math.floor((city.pop - 1) / 3) }}。社区与航天中心不占容量。
      </p>
      <p v-if="city.walls > 0" class="hint">
        城墙 {{ Math.round(city.walls) }} / 100，城市可进行两格远程攻击。
      </p></template
    >
  </section>
</template>
