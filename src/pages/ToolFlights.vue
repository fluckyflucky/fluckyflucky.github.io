<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { makeTasks, parseCities, cityName, searchFlight, taskKey, type FlightTask, type FlightResult } from '../tools/flights'

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
const onlyPrices = ref(false), sortBy = ref('price'), routeFilter = ref(''), maxPrice = ref(''), shown = ref(30)
const originSuggestions = ['上海', '北京', '广州', '深圳', '杭州', '香港']
const destinationSuggestions = ['东京', '大阪', '福冈', '札幌', '冲绳', '首尔']
const elapsed = ref(0)
let clock: ReturnType<typeof setInterval> | undefined
let scanStarted = 0
const errors = ref<Record<string, string>>({})
const refreshed = ref<Set<string>>(new Set())
let controller: AbortController | null = null

const plan = computed(() => {
  try { return { tasks: makeTasks(form.from, form.to, form.start, form.end), error: '' } }
  catch (error) { return { tasks: [], error: (error as Error).message } }
})
const rows = computed(() => plan.value.tasks.map(task => ({ task, key: taskKey(task), result: cache.value[taskKey(task)] }))
  .sort((a, b) => (a.result?.price ?? Infinity) - (b.result?.price ?? Infinity) || a.key.localeCompare(b.key)))
const routes = computed(() => [...new Map(plan.value.tasks.map(task => [`${task.from}:${task.to}`, task])).entries()])
const days = computed(() => new Set(plan.value.tasks.map(task => task.date)).size)
const visibleRows = computed(() => rows.value.filter(row =>
  (!onlyPrices.value || row.result?.price != null) &&
  (!routeFilter.value || `${row.task.from}:${row.task.to}` === routeFilter.value) &&
  (maxPrice.value === '' || (row.result?.price != null && row.result.price <= Number(maxPrice.value))))
  .sort((a, b) => sortBy.value === 'date' ? a.key.localeCompare(b.key) : 0))
const displayedRows = computed(() => visibleRows.value.slice(0, shown.value))
const unfinished = computed(() => plan.value.tasks.filter(task => !refreshed.value.has(taskKey(task))))
const cheapest = computed(() => visibleRows.value.filter(row => row.result?.price != null)
  .reduce<typeof rows.value[number] | undefined>((best, row) => !best || row.result!.price! < best.result!.price! ? row : best, undefined))
const elapsedLabel = computed(() => elapsed.value < 60 ? `${elapsed.value} 秒` : `${Math.floor(elapsed.value / 60)} 分 ${elapsed.value % 60} 秒`)
function selectedCities(side: 'from' | 'to') {
  try { return parseCities(form[side]) } catch { return [] }
}
function toggleCity(side: 'from' | 'to', name: string) {
  const code = parseCities(name)[0]
  const values = form[side].trim().split(/[\s,，、;；]+/).filter(Boolean)
  const index = values.findIndex((value: string) => { try { return parseCities(value)[0] === code } catch { return false } })
  if (index >= 0) values.splice(index, 1); else values.push(name)
  form[side] = values.join(', ')
}
function setDays(count: number) {
  const start = form.start || futureDate(1)
  const end = new Date(`${start}T00:00:00Z`)
  if (!Number.isFinite(end.getTime())) return
  end.setUTCDate(end.getUTCDate() + count - 1)
  form.start = start; form.end = end.toISOString().slice(0, 10)
}
function revealInvalid(event: Event) {
  const settings = (event.target as HTMLElement).closest('details')
  if (settings) settings.open = true
}
function jumpToBest() {
  if (!cheapest.value) return
  const key = cheapest.value.key
  const index = visibleRows.value.findIndex(row => row.key === key)
  shown.value = Math.max(shown.value, index + 1)
  // Wait for the newly revealed row before scrolling and moving keyboard focus.
  void nextTick(() => {
    const element = document.getElementById(`flight-${key}`)
    element?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' })
    element?.focus({ preventScroll: true })
  })
}
const progress = computed(() => plan.value.tasks.length ? completed.value / plan.value.tasks.length * 100 : 0)
function store(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) }
  catch { storageMessage.value = '本地存储不可用，当前结果仍可查看，但关闭后不能保存。' }
}
watch(form, () => store(SETTINGS, form), { deep: true })
watch(() => [form.from, form.to, form.start, form.end], () => {
  if (!running.value) { completed.value = 0; elapsed.value = 0; message.value = ''; errors.value = {}; refreshed.value = new Set(); shown.value = 30 }
})
watch(() => form.start, start => { if (start && form.end < start) form.end = start })
watch(routes, choices => { if (!choices.some(([key]) => key === routeFilter.value)) routeFilter.value = '' })
watch([onlyPrices, sortBy, routeFilter, maxPrice], () => { shown.value = 30 })
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
  running.value = true; queued.value = tasks.length; message.value = ''; elapsed.value = 0; scanStarted = Date.now()
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
    elapsed.value = Math.floor((Date.now() - scanStarted) / 1000)
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
onMounted(() => {
  document.title = '低价机票扫描 · 青い夏'
  clock = setInterval(() => { if (running.value) elapsed.value = Math.floor((Date.now() - scanStarted) / 1000) }, 1000)
  if (saved && form.autoRefresh) void scan()
})
onBeforeUnmount(() => { stop(); clearInterval(clock) })
</script>

<template>
  <div class="flights-page">
    <div class="page-heading">
      <span class="eyebrow">FLIGHT SCANNER</span>
      <h1>低价机票扫描</h1>
      <p>在哪出发、想去哪里？选一段日期，一起看看哪天更便宜。</p>
    </div>
    <form class="scan-form" @submit.prevent="scan()" @invalid.capture="revealInvalid">
      <fieldset :disabled="running">
        <div class="form-grid">
          <div class="city-field">
            <label for="flight-from">出发城市 / 机场</label><input id="flight-from" v-model="form.from" placeholder="上海, 北京 或 PVG, PEK" required />
            <div class="city-shortcuts" aria-label="常用出发城市"><button v-for="name in originSuggestions" :key="name" type="button" :aria-pressed="selectedCities('from').includes(parseCities(name)[0])" @click="toggleCity('from', name)">{{ name }}</button></div>
            <small class="code-preview">{{ selectedCities('from').join(' · ') || '选择城市或输入三字码' }}</small>
          </div>
          <div class="city-field">
            <label for="flight-to">目的城市 / 机场</label><input id="flight-to" v-model="form.to" placeholder="东京, 大阪 或 TYO, KIX" required />
            <div class="city-shortcuts" aria-label="常用目的城市"><button v-for="name in destinationSuggestions" :key="name" type="button" :aria-pressed="selectedCities('to').includes(parseCities(name)[0])" @click="toggleCity('to', name)">{{ name }}</button></div>
            <small class="code-preview">{{ selectedCities('to').join(' · ') || '选择城市或输入三字码' }}</small>
          </div>
          <label>开始日期<input v-model="form.start" type="date" required /></label>
          <label>结束日期<input v-model="form.end" type="date" :min="form.start" required /></label>
        </div>
        <div class="date-shortcuts"><span>从开始日期起</span><button v-for="count in [3, 7, 14]" :key="count" type="button" :aria-pressed="days === count" @click="setDays(count)">{{ count }} 天</button>
          <button type="button" class="text-button" @click="[form.from, form.to] = [form.to, form.from]">交换出发 / 目的地</button></div>
        <p class="form-hint">多个城市用逗号或空格分隔；支持中文城市名和三字码，TYO 包含东京各机场。</p>
        <label class="check-label"><input v-model="form.autoRefresh" type="checkbox" /> 重新打开时自动刷新上次的查询</label>
        <details class="advanced">
          <summary>请求设置 <small>间隔 {{ form.minDelay }}–{{ form.maxDelay }} 秒 · 同时查询 {{ form.concurrency }} 项</small></summary>
          <div class="form-grid">
            <label>最短请求间隔（秒）<input v-model.number="form.minDelay" type="number" min="0" step="0.1" required /></label>
            <label>最长请求间隔（秒）<input v-model.number="form.maxDelay" type="number" :min="form.minDelay" step="0.1" required /></label>
            <label>最多同时查询<input v-model.number="form.concurrency" type="number" min="1" max="12" step="1" required /></label>
          </div>
          <p class="form-hint">按随机间隔发起下一项，无需等待上一项返回。保持页面打开即可继续。</p>
        </details>
      </fieldset>
      <div class="actions">
        <button type="submit" class="primary" :disabled="running || !!plan.error">{{ running ? '正在扫描…' : '扫描 / 刷新全部' }}</button>
        <button v-if="!running && message && unfinished.length && !plan.error" type="button" class="secondary" @click="scan(true)">继续未完成 / 重试失败（{{ unfinished.length }}）</button>
        <span>{{ plan.tasks.length }} 个日期与城市组合（{{ routes.length }} 条航线 × {{ days }} 天）<br />单程 · 1 成人 · 经济舱 · 人民币</span>
      </div>
      <p v-if="plan.error" class="error" role="alert">{{ plan.error }}</p>
      <p v-if="storageMessage" class="error" role="alert">{{ storageMessage }}</p>
    </form>

    <section class="scan-summary" :class="{ scanning: running }" aria-live="polite">
      <div class="summary-line"><span>{{ running ? `查询中 ${active.size} 项 · 待发 ${queued} 项 · 成功 ${refreshed.size} · 失败 ${Object.keys(errors).length}` : (message || '先显示本地缓存，扫描后逐项更新。') }}</span><strong>{{ completed }} / {{ plan.tasks.length }}</strong></div>
      <progress :value="completed" :max="plan.tasks.length || 1" :aria-label="`扫描进度 ${Math.round(progress)}%`" />
      <div class="scan-meta" aria-live="off"><span>{{ running || elapsed ? `已用 ${elapsedLabel}` : '数据保存在当前浏览器' }} · {{ Math.round(progress) }}%</span><button v-if="running" type="button" class="secondary" @click="stop">停止</button></div>
    </section>
    <section v-if="cheapest" class="best-price">
        <div><span>当前筛选最低价{{ running ? ' · 扫描中' : '' }}</span><strong>¥{{ cheapest.result!.price!.toLocaleString('zh-CN') }}</strong></div>
        <p>{{ cheapest.task.date }} · {{ cityName(cheapest.task.from) }} → {{ cityName(cheapest.task.to) }}<br />{{ refreshed.has(cheapest.key) ? '本轮已更新' : '本地缓存' }} · {{ new Date(cheapest.result!.fetchedAt).toLocaleString('zh-CN') }}</p>
      <button type="button" class="secondary" @click="jumpToBest">查看这张票 ↓</button>
    </section>

    <div class="results-header"><h2>价格列表 <small>{{ visibleRows.length }} / {{ rows.length }}</small></h2>
      <div class="result-controls">
        <label>航线 <select v-model="routeFilter" aria-label="筛选航线"><option value="">全部航线</option><option v-for="[key, task] in routes" :key="key" :value="key">{{ cityName(task.from) }} → {{ cityName(task.to) }}</option></select></label>
        <label class="budget-filter" for="flight-budget">预算上限（¥）<input id="flight-budget" v-model="maxPrice" type="number" min="0" placeholder="不限" /></label>
        <label class="check-label"><input v-model="onlyPrices" type="checkbox" /> 只看有报价</label>
        <label>排序 <select v-model="sortBy" aria-label="排序"><option value="price">价格从低到高</option><option value="date">日期 / 航线</option></select></label>
      </div>
    </div>
    <div v-if="visibleRows.length" class="result-list">
      <article v-for="row in displayedRows" :key="row.key" :id="`flight-${row.key}`" tabindex="-1" class="result-row" :class="{ querying: active.has(row.key) }">
        <div class="route-detail"><strong>{{ cityName(row.task.from) }} <span>→</span> {{ cityName(row.task.to) }}</strong><span>{{ row.task.date }} · {{ row.task.from }} → {{ row.task.to }}</span>
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
    <button v-if="visibleRows.length > shown" type="button" class="secondary show-more" @click="shown += 30">再显示 {{ Math.min(30, visibleRows.length - shown) }} 项（还剩 {{ visibleRows.length - shown }} 项）</button>
    <div v-if="!visibleRows.length && rows.length" class="empty-results"><strong>暂时没有符合条件的报价</strong><p>可以放宽预算、选择其他航线，或查看尚未完成的查询。</p><button type="button" class="secondary" @click="onlyPrices = false; routeFilter = ''; maxPrice = ''">清除筛选</button></div>
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
input:focus-visible, select:focus-visible, button:focus-visible, summary:focus-visible, a:focus-visible, article:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 3px; }
.form-hint { margin: 13px 0; }
.check-label { display: flex; align-items: center; gap: 9px; min-height: 44px; cursor: pointer; }
.check-label input { accent-color: #0284c7; width: 16px; height: 16px; }
.actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
.actions span { color: #a8a29e; font-size: 12px; }
button { cursor: pointer; border-radius: 9px; padding: 11px 16px; font-size: 14px; font-weight: 600; min-height: 44px; }
.primary { background: #0284c7; color: white; }
.primary:hover { background: #0369a1; }
.secondary { background: #292524; border: 1px solid #57534e; }
button:disabled { cursor: default; opacity: .5; }
fieldset:disabled { opacity: .65; }
.error { color: #fca5a5 !important; font-size: 12px; overflow-wrap: anywhere; }
.scan-summary { margin: 18px 0; }
.scan-summary.scanning { position: sticky; top: 76px; z-index: 10; background: #1c1917; box-shadow: 0 8px 24px #0005; }
.scan-meta { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 10px; font-size: 12px; color: #a8a29e; }
.summary-line { display: flex; gap: 14px; justify-content: space-between; font-size: 13px; color: #d6d3d1; }
.summary-line strong { white-space: nowrap; }
progress { width: 100%; height: 7px; display: block; margin-top: 13px; accent-color: #38bdf8; border: 0; border-radius: 10px; overflow: hidden; }
progress::-webkit-progress-bar { background: #44403c; }
progress::-webkit-progress-value { background: #38bdf8; }
.best-price { border: 1px solid #075985; background: #082f4933; border-radius: 16px; margin: 18px 0 26px; padding: 20px; flex-wrap: wrap; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.best-price span { display: block; font-size: 12px; color: #a8a29e; }
.best-price strong { display: block; font-size: 32px; color: #7dd3fc; font-weight: 700; }
.best-price p { font-size: 12px; line-height: 1.9; color: #d6d3d1; }
.results-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.result-controls { display: flex; width: 100%; gap: 12px; flex-wrap: wrap; align-items: center; }
select { background: #0c0a09; color: #d6d3d1; border: 1px solid #57534e; border-radius: 6px; padding: 6px; font-size: 12px; }
h2 { font-size: 17px; font-weight: 600; }
.results-header span { font-size: 11px; color: #a8a29e; }
.result-list { display: grid; gap: 9px; }
.result-row { padding: 17px; border: 1px solid #44403c; border-radius: 12px; display: flex; justify-content: space-between; gap: 15px; background: #1c191780; scroll-margin-top: 240px; }
.result-row.querying { border-color: #38bdf8; }
.result-row:focus { outline: 2px solid #7dd3fc; outline-offset: 3px; }
.route-detail, .price-detail { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.route-detail strong { font-size: 16px; }
.route-detail strong span { color: #78716c; margin: 0 5px; }
.route-detail > span, .price-detail > span { color: #a8a29e; font-size: 12px; }
small { color: #a8a29e; font-size: 11px; line-height: 1.7; }
.price-detail { text-align: right; flex-shrink: 0; }
.price-detail strong { color: #7dd3fc; font-size: 20px; }
a { color: #7dd3fc; font-size: 13px; margin-top: 3px; min-height: 44px; display: inline-flex; align-items: center; justify-content: flex-end; }
.footer-note { margin-top: 18px; font-size: 11px; }
.city-shortcuts, .date-shortcuts { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; }
.city-shortcuts button, .date-shortcuts button { font-size: 12px; padding: 8px 10px; min-height: 44px; border: 1px solid #44403c; background: #292524; font-weight: 400; }
button[aria-pressed=true] { color: #7dd3fc; border-color: #0284c7; background: #082f49; }
button:hover:not(:disabled) { filter: brightness(1.15); }
.date-shortcuts { margin-top: 14px; }
.date-shortcuts > span { font-size: 12px; color: #a8a29e; }
.date-shortcuts .text-button { margin-left: auto; }
.code-preview { display: block; margin-top: 4px; }
.advanced { margin-top: 18px; border-top: 1px solid #44403c; padding-top: 12px; }
summary { cursor: pointer; font-size: 13px; min-height: 44px; padding-top: 10px; }
summary small { margin-left: 8px; }
.advanced .form-grid { margin-top: 12px; }
.budget-filter { display: flex; align-items: center; gap: 6px; }
.budget-filter input { width: 90px; margin-top: 0; padding: 7px; }
select { min-height: 44px; max-width: 230px; }
.empty-results { border: 1px dashed #57534e; border-radius: 12px; padding: 24px; text-align: center; }
.empty-results p { font-size: 13px; color: #a8a29e; margin: 10px 0; }
.show-more { display: block; width: 100%; margin-top: 14px; }
@media (max-width: 520px) {
  h1 { font-size: 25px; }
  input:not([type=checkbox]), select { font-size: 16px; }
  .scan-summary.scanning { top: 64px; }
  .date-shortcuts .text-button { margin-left: 0; }
  .scan-form, .scan-summary { padding: 16px; }
  .form-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .best-price { align-items: flex-start; flex-direction: column; gap: 5px; }
  .results-header { align-items: flex-start; flex-direction: column; gap: 4px; }
  .result-row { padding: 13px; flex-wrap: wrap; }
  .route-detail { flex: 1 1 160px; }
  .price-detail { flex: 0 1 auto; max-width: 100%; }
}
</style>
