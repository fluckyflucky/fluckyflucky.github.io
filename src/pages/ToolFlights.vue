<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { makeTasks, searchFlight, taskKey, type FlightTask, type FlightResult } from '../tools/flights'

const SETTINGS = 'aoinatsu:flights:settings:v1'
const CACHE = 'aoinatsu:flights:cache:v1'
function readStore(key: string) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}
function futureDate(offset: number) {
  const date = new Date(); date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const saved = readStore(SETTINGS)
const form = reactive({ from: '上海', to: '东京, 大阪', start: futureDate(14), end: futureDate(16),
  minDelay: 3, maxDelay: 6, concurrency: 6, autoRefresh: true, ...saved })
const cache = ref<Record<string, FlightResult>>(readStore(CACHE) ?? {})
const running = ref(false), completed = ref(0), message = ref(''), storageMessage = ref('')
const active = ref<Set<string>>(new Set()), queued = ref(0)
const onlyPrices = ref(false), sortBy = ref('price')
const errors = ref<Record<string, string>>({})
const refreshed = ref<Set<string>>(new Set())
let controller: AbortController | null = null

const plan = computed(() => {
  try { return { tasks: makeTasks(form.from, form.to, form.start, form.end), error: '' } }
  catch (error) { return { tasks: [], error: (error as Error).message } }
})
const rows = computed(() => plan.value.tasks.map(task => ({ task, key: taskKey(task), result: cache.value[taskKey(task)] }))
  .sort((a, b) => (a.result?.price ?? Infinity) - (b.result?.price ?? Infinity) || a.key.localeCompare(b.key)))
const visibleRows = computed(() => rows.value.filter(row => !onlyPrices.value || row.result?.price != null)
  .sort((a, b) => sortBy.value === 'date' ? a.key.localeCompare(b.key) : 0))
const unfinished = computed(() => plan.value.tasks.filter(task => !refreshed.value.has(taskKey(task))))
const cheapest = computed(() => rows.value.find(row => row.result?.price != null))
const progress = computed(() => plan.value.tasks.length ? completed.value / plan.value.tasks.length * 100 : 0)
function store(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) }
  catch { storageMessage.value = '本地存储不可用，当前结果仍可查看，但关闭后不能保存。' }
}
watch(form, () => store(SETTINGS, form), { deep: true })
watch(() => [form.from, form.to, form.start, form.end], () => {
  if (!running.value) { completed.value = 0; message.value = ''; errors.value = {}; refreshed.value = new Set() }
})
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve() }, ms)
    function cancel() { clearTimeout(timer); reject(signal.reason) }
    signal.addEventListener('abort', cancel, { once: true })
    if (signal.aborted) cancel()
  })
}
async function scan(resume = false) {
  if (running.value) return
  if (plan.value.error) { message.value = plan.value.error; return }
  const min = Number(form.minDelay), max = Number(form.maxDelay), limit = Number(form.concurrency)
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
    message.value = '请求间隔需为非负秒数，最长间隔不能小于最短间隔。'; return
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 12) {
    message.value = '同时查询数需为 1 到 12 的整数。'; return
  }
  const tasks = [...(resume ? unfinished.value : plan.value.tasks)]
  if (!tasks.length) return
  store(SETTINGS, form)
  if (!resume) { completed.value = 0; errors.value = {}; refreshed.value = new Set() }
  else {
    for (const task of tasks) delete errors.value[taskKey(task)]
    completed.value = refreshed.value.size + Object.keys(errors.value).length
  }
  running.value = true; queued.value = tasks.length; message.value = ''
  controller = new AbortController()
  const signal = controller.signal
  const pending = new Set<Promise<void>>()
  async function query(task: FlightTask) {
    const key = taskKey(task)
    active.value.add(key)
    try {
      const result = await searchFlight(task, signal)
      if (signal.aborted) return
      cache.value[key] = result
      refreshed.value.add(key)
      store(CACHE, cache.value)
    } catch (error) {
      if (signal.aborted) return
      errors.value[key] = error instanceof Error ? error.message : '查询失败，请稍后重试。'
    } finally {
      active.value.delete(key)
      completed.value = refreshed.value.size + Object.keys(errors.value).length
    }
  }
  try {
    for (const [index, task] of tasks.entries()) {
      // Space request starts; a slow response does not delay the next start.
      if (index > 0) await wait((min + Math.random() * (max - min)) * 1000, signal)
      while (pending.size >= limit && !signal.aborted) await Promise.race(pending)
      if (signal.aborted) break
      queued.value--
      const request = query(task)
      pending.add(request)
      void request.then(() => pending.delete(request))
    }
  } catch {
    // Stopping also cancels the interval timer and all outstanding fetches.
  } finally {
    await Promise.allSettled(pending)
    message.value = signal.aborted ? '已停止，已完成的结果已保存，可继续未完成项。'
      : `扫描完成：${refreshed.value.size} 项成功，${Object.keys(errors.value).length} 项失败。`
    running.value = false; queued.value = 0; active.value.clear(); controller = null
  }
}
function stop() { controller?.abort(new Error('已停止')) }
function formatTime(value: string) { return value ? value.replace('T', ' ').replace(/([+-]\d{2}:\d{2})$/, ' ($1)') : '' }
function searchLink(row: typeof rows.value[number]) {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${row.task.from} to ${row.task.to} on ${row.task.date} one way`)}`
}
onMounted(() => { document.title = '低价机票扫描 · 青い夏'; if (saved && form.autoRefresh) void scan() })
onBeforeUnmount(stop)
</script>

<template>
  <div class="flights-page">
    <div class="page-heading">
      <span class="eyebrow">FLIGHT SCANNER</span>
      <h1>低价机票扫描</h1>
      <p>选几个城市和一段日期，慢慢找一张便宜的机票。</p>
    </div>
    <form class="scan-form" @submit.prevent="scan()">
      <fieldset :disabled="running">
        <div class="form-grid">
          <label>出发城市 / 机场<input v-model="form.from" placeholder="上海, 北京 或 PVG, PEK" required /></label>
          <label>目的城市 / 机场<input v-model="form.to" placeholder="东京, 大阪 或 TYO, KIX" required /></label>
          <label>开始日期<input v-model="form.start" type="date" required /></label>
          <label>结束日期<input v-model="form.end" type="date" :min="form.start" required /></label>
          <label>最短请求间隔（秒）<input v-model.number="form.minDelay" type="number" min="0" step="0.1" required /></label>
          <label>最长请求间隔（秒）<input v-model.number="form.maxDelay" type="number" :min="form.minDelay" step="0.1" required /></label>
          <label>最多同时查询<input v-model.number="form.concurrency" type="number" min="1" max="12" step="1" required /></label>
        </div>
        <p class="form-hint">多个城市用逗号或空格分隔。支持常见中文城市名，也可直接填三字码；TYO 包含东京各机场。按间隔发起下一项，无需等待上一项返回。</p>
        <label class="check-label"><input v-model="form.autoRefresh" type="checkbox" /> 重新打开时自动刷新上次的查询</label>
      </fieldset>
      <div class="actions">
        <button type="submit" class="primary" :disabled="running || !!plan.error">{{ running ? '正在扫描…' : '扫描 / 刷新全部' }}</button>
        <button v-if="running" type="button" class="secondary" @click="stop">停止</button>
        <button v-if="!running && message && unfinished.length && !plan.error" type="button" class="secondary" @click="scan(true)">继续未完成 / 重试失败（{{ unfinished.length }}）</button>
        <button type="button" class="secondary" :disabled="running" @click="[form.from, form.to] = [form.to, form.from]">交换出发 / 目的地</button>
        <span>{{ plan.tasks.length }} 个日期与城市组合 · 单程 · 1 成人 · 经济舱 · CNY</span>
      </div>
      <p v-if="plan.error" class="error" role="alert">{{ plan.error }}</p>
      <p v-if="storageMessage" class="error" role="alert">{{ storageMessage }}</p>
    </form>

    <section class="scan-summary" aria-live="polite">
      <div class="summary-line"><span>{{ running ? `查询中 ${active.size} 项 · 待发 ${queued} 项 · 成功 ${refreshed.size} · 失败 ${Object.keys(errors).length}` : (message || '先显示本地缓存，扫描后逐项更新。') }}</span><strong>{{ completed }} / {{ plan.tasks.length }}</strong></div>
      <progress :value="completed" :max="plan.tasks.length || 1" :aria-label="`扫描进度 ${Math.round(progress)}%`" />
      <div v-if="cheapest" class="best-price">
        <div><span>当前列表最低价{{ running ? ' · 扫描中' : '' }}</span><strong>¥{{ cheapest.result!.price!.toLocaleString('zh-CN') }}</strong></div>
        <p>{{ cheapest.task.date }} · {{ cheapest.task.from }} → {{ cheapest.task.to }}<br />{{ refreshed.has(cheapest.key) ? '本轮已更新' : '本地缓存' }} · {{ new Date(cheapest.result!.fetchedAt).toLocaleString('zh-CN') }}</p>
      </div>
    </section>

    <div class="results-header"><h2>价格列表 <small>{{ visibleRows.length }} / {{ rows.length }}</small></h2>
      <div class="result-controls">
        <label class="check-label"><input v-model="onlyPrices" type="checkbox" /> 只看有报价</label>
        <label>排序 <select v-model="sortBy" aria-label="排序"><option value="price">价格从低到高</option><option value="date">日期 / 航线</option></select></label>
      </div>
    </div>
    <div v-if="visibleRows.length" class="result-list">
      <article v-for="row in visibleRows" :key="row.key" class="result-row" :class="{ querying: active.has(row.key) }">
        <div class="route-detail"><strong>{{ row.task.from }} <span>→</span> {{ row.task.to }}</strong><span>{{ row.task.date }}</span>
          <small v-if="row.result?.flights">{{ row.result.airline }} · {{ row.result.flights }}</small>
          <small v-if="row.result?.departure">{{ formatTime(row.result.departure) }} → {{ formatTime(row.result.arrival) }}</small>
          <small v-if="errors[row.key]" class="error">{{ errors[row.key] }}{{ row.result ? '（保留上次结果）' : '' }}</small>
        </div>
        <div class="price-detail">
          <strong>{{ row.result ? (row.result.price === null ? '无报价' : `¥${row.result.price.toLocaleString('zh-CN')}`) : '—' }}</strong>
          <span>{{ active.has(row.key) ? '查询中…' : errors[row.key] ? '刷新失败' : refreshed.has(row.key) ? '本轮已更新' : row.result ? '本地缓存' : '待查询' }}</span>
          <small v-if="row.result">{{ new Date(row.result.fetchedAt).toLocaleString('zh-CN') }}</small>
          <a :href="searchLink(row)" target="_blank" rel="noopener noreferrer">去查票 ↗</a>
        </div>
      </article>
    </div>
    <p v-if="!visibleRows.length && rows.length" class="form-hint">当前还没有可显示的报价，可取消筛选查看全部查询项。</p>
    <p class="footer-note">价格来自 ITA Matrix，购买时以航司或售票平台为准。随机间隔发起查询；保持页面打开即可继续。</p>
  </div>
</template>

<style scoped>
.flights-page { color: #e7e5e4; }
.page-heading { margin-bottom: 26px; }
.eyebrow { font-size: 11px; letter-spacing: .18em; color: #7dd3fc; }
h1 { font-size: 28px; font-weight: 700; margin: 8px 0; }
.page-heading p, .form-hint, .footer-note { color: #a8a29e; font-size: 13px; line-height: 1.8; }
.scan-form, .scan-summary { border: 1px solid #44403c; border-radius: 16px; padding: 20px; background: #1c1917aa; }
fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
label { display: block; font-size: 13px; color: #d6d3d1; }
input:not([type=checkbox]) { display: block; width: 100%; min-width: 0; box-sizing: border-box; margin-top: 7px; padding: 11px 12px; border: 1px solid #57534e; border-radius: 9px; background: #0c0a09; color: #e7e5e4; color-scheme: dark; font-size: 14px; }
input:focus-visible, select:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 3px; }
.form-hint { margin: 13px 0; }
.check-label { display: flex; align-items: center; gap: 9px; }
.check-label input { accent-color: #0284c7; width: 16px; height: 16px; }
.actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
.actions span { color: #a8a29e; font-size: 12px; }
button { cursor: pointer; border-radius: 9px; padding: 11px 16px; font-size: 14px; font-weight: 600; }
.primary { background: #0284c7; color: white; }
.primary:hover { background: #0369a1; }
.secondary { background: #292524; border: 1px solid #57534e; }
button:disabled { cursor: default; opacity: .5; }
fieldset:disabled { opacity: .65; }
.error { color: #fca5a5 !important; font-size: 12px; overflow-wrap: anywhere; }
.scan-summary { margin: 18px 0 26px; }
.summary-line { display: flex; gap: 14px; justify-content: space-between; font-size: 13px; color: #d6d3d1; }
.summary-line strong { white-space: nowrap; }
progress { width: 100%; height: 7px; display: block; margin-top: 13px; accent-color: #38bdf8; border: 0; border-radius: 10px; overflow: hidden; }
progress::-webkit-progress-bar { background: #44403c; }
progress::-webkit-progress-value { background: #38bdf8; }
.best-price { border-top: 1px solid #44403c; margin-top: 18px; padding-top: 18px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.best-price span { display: block; font-size: 12px; color: #a8a29e; }
.best-price strong { display: block; font-size: 32px; color: #7dd3fc; font-weight: 700; }
.best-price p { font-size: 12px; line-height: 1.9; color: #d6d3d1; }
.results-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.result-controls { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
select { background: #0c0a09; color: #d6d3d1; border: 1px solid #57534e; border-radius: 6px; padding: 6px; font-size: 12px; }
h2 { font-size: 17px; font-weight: 600; }
.results-header span { font-size: 11px; color: #a8a29e; }
.result-list { display: grid; gap: 9px; }
.result-row { padding: 17px; border: 1px solid #44403c; border-radius: 12px; display: flex; justify-content: space-between; gap: 15px; background: #1c191780; }
.result-row.querying { border-color: #38bdf8; }
.route-detail, .price-detail { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.route-detail strong { font-size: 16px; }
.route-detail strong span { color: #78716c; margin: 0 5px; }
.route-detail > span, .price-detail > span { color: #a8a29e; font-size: 12px; }
small { color: #a8a29e; font-size: 11px; line-height: 1.7; }
.price-detail { text-align: right; flex-shrink: 0; }
.price-detail strong { color: #7dd3fc; font-size: 20px; }
a { color: #7dd3fc; font-size: 12px; margin-top: 3px; }
.footer-note { margin-top: 18px; font-size: 11px; }
@media (max-width: 520px) {
  h1 { font-size: 25px; }
  .scan-form, .scan-summary { padding: 16px; }
  .form-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .best-price { align-items: flex-start; flex-direction: column; gap: 5px; }
  .results-header { align-items: flex-start; flex-direction: column; gap: 4px; }
  .result-row { padding: 13px; flex-wrap: wrap; }
  .route-detail { flex: 1 1 160px; }
  .price-detail { flex: 0 1 auto; max-width: 100%; }
}
</style>
