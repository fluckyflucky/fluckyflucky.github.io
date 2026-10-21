<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

onMounted(() => { document.title = '东京首都圈线路图 · 青い夏' })

const language = ref<'ja' | 'en'>('ja')
const imageUrl = computed(() => `/img/tools/tokyo-railmap-${language.value}.svg`)
const originalWidth = 11608
const originalHeight = 6654
const minScale = 0.02
const maxScale = 1
const viewport = ref<HTMLDivElement>()
const scale = ref(0.08)
const loaded = ref(false)
const failed = ref(false)
const dragging = ref(false)
const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)
let initialized = false
let drag: { id: number; x: number; y: number; left: number; top: number } | undefined

async function setScale(value: number) {
  const el = viewport.value
  if (!el) return
  const x = (el.scrollLeft + el.clientWidth / 2) / scale.value
  const y = (el.scrollTop + el.clientHeight / 2) / scale.value
  scale.value = Math.min(maxScale, Math.max(minScale, value))
  await nextTick()
  el.scrollLeft = x * scale.value - el.clientWidth / 2
  el.scrollTop = y * scale.value - el.clientHeight / 2
}

async function fitMap() {
  const el = viewport.value
  if (!el) return
  await setScale(Math.min(el.clientWidth / originalWidth, el.clientHeight / originalHeight))
  el.scrollTo(0, 0)
}

async function showCentralTokyo() {
  await setScale(0.4)
  const el = viewport.value
  if (!el) return
  el.scrollLeft = 6050 * scale.value - el.clientWidth / 2
  el.scrollTop = 2670 * scale.value - el.clientHeight / 2
}

async function imageLoaded() {
  loaded.value = true
  failed.value = false
  if (!initialized) {
    initialized = true
    await fitMap()
  }
}

function changeLanguage(event: Event) {
  language.value = (event.target as HTMLSelectElement).value as 'ja' | 'en'
  loaded.value = false
  failed.value = false
}

function startDrag(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0 || !viewport.value) return
  const el = viewport.value
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop }
  dragging.value = true
  el.setPointerCapture(event.pointerId)
}

function moveDrag(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId || !viewport.value) return
  viewport.value.scrollLeft = drag.left - (event.clientX - drag.x)
  viewport.value.scrollTop = drag.top - (event.clientY - drag.y)
}

function endDrag(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return
  drag = undefined
  dragging.value = false
  if (viewport.value?.hasPointerCapture(event.pointerId)) viewport.value.releasePointerCapture(event.pointerId)
}
</script>

<template>
  <section class="tokyo-map">
    <h1 class="text-2xl font-bold mb-2 text-stone-100">东京首都圈线路图</h1>
    <p class="text-sm text-stone-400 mb-5">首都圏 · 高清 SVG · 日文 / 英文</p>

    <div class="source-note">
      <p><strong>原图来源 / REF：</strong><a href="https://railmaps.jp/tokyo" target="_blank" rel="noopener noreferrer">Railmaps · 鉄道路線図（首都圏）↗</a></p>
      <p class="text-xs text-stone-400 mt-2">图形与内容归原作者所有。本站根据原站公开地图数据导出 SVG，采集日期为 2026 年 10 月 21 日，非原站发布的下载版本。</p>
      <p class="text-xs text-stone-400 mt-2">原站未标注地图更新日期；此处为静态快照，仅供参考。线路与停站信息以铁路公司最新公告为准。</p>
    </div>

    <div class="map-toolbar" role="group" aria-label="地图查看控制">
      <label for="tokyo-map-language">语言</label>
      <select id="tokyo-map-language" :value="language" @change="changeLanguage">
        <option value="ja">日文</option>
        <option value="en">英文</option>
      </select>
      <button type="button" :disabled="scale <= minScale" aria-label="缩小地图" @click="setScale(scale / 1.5)">−</button>
      <output class="zoom-label" aria-live="polite">{{ zoomLabel }}</output>
      <button type="button" :disabled="scale >= maxScale" aria-label="放大地图" @click="setScale(scale * 1.5)">＋</button>
      <button type="button" @click="fitMap">查看全图</button>
      <button type="button" @click="showCentralTokyo">东京中心</button>
      <a :href="imageUrl" :download="`tokyo-railmap-${language}.svg`">下载 SVG（{{ language === 'ja' ? '9.9' : '15.1' }} MB）</a>
      <a :href="imageUrl" target="_blank" rel="noopener noreferrer">打开大图 ↗</a>
    </div>
    <p id="tokyo-map-help" class="text-xs text-stone-400 mb-3">可缩放、滚动或按住鼠标拖动查看；手机可滑动查看。线路与站名为矢量，放大仍清晰；原站装饰插图保留为位图。</p>
    <div class="map-status" aria-live="polite">
      <p v-if="!loaded && !failed" role="status" class="text-sm text-stone-400">正在加载高清线路图…</p>
      <p v-if="failed" role="alert" class="text-sm text-amber-300">线路图加载失败，请刷新重试，或通过上方来源链接查看。</p>
    </div>
    <div
      ref="viewport"
      class="map-viewport"
      :class="{ dragging }"
      tabindex="0"
      role="region"
      aria-label="东京首都圈线路图滚动查看窗口"
      aria-describedby="tokyo-map-help"
      :aria-busy="!loaded && !failed"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
    >
      <img
        :src="imageUrl"
        :alt="`东京首都圈铁道路网图，${language === 'ja' ? '日文' : '英文'}版，来源 Railmaps（railmaps.jp），2026 年 10 月 21 日采集`"
        :width="originalWidth * scale"
        :height="originalHeight * scale"
        :style="{ width: `${originalWidth * scale}px`, height: `${originalHeight * scale}px` }"
        decoding="async"
        draggable="false"
        @load="imageLoaded"
        @error="failed = true; loaded = false"
      />
    </div>
  </section>
</template>

<style scoped>
.tokyo-map { position: relative; z-index: 2; }
.source-note { padding: 16px; border: 1px solid #387883; border-radius: 12px; background: #14313b; color: #c3e7ed; font-size: 14px; line-height: 1.7; }
.tokyo-map a { color: #7dd3fc; text-decoration: underline; text-underline-offset: 3px; }
.tokyo-map a:hover { color: #bae6fd; }
.map-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 20px 0 12px; font-size: 13px; }
.map-toolbar button, .map-toolbar select { min-width: 44px; min-height: 44px; padding: 8px 12px; border: 1px solid #44403c; border-radius: 8px; background: #1c1917; color: #e7e5e4; }
.map-toolbar button:hover:not(:disabled), .map-toolbar select:hover { border-color: #7dd3fc; }
.map-toolbar button:disabled { opacity: .4; cursor: default; }
.map-toolbar a { padding: 12px 4px; }
.zoom-label { min-width: 44px; text-align: center; color: #d6d3d1; font-variant-numeric: tabular-nums; }
.map-status { min-height: 20px; margin-bottom: 8px; }
.map-viewport { width: 100%; height: 65vh; height: 65dvh; overflow: auto; border: 1px solid #57534e; border-radius: 12px; background: #fff; cursor: grab; overscroll-behavior: contain; }
.map-viewport.dragging { cursor: grabbing; }
.map-viewport img { display: block; max-width: none; user-select: none; }
.map-viewport::-webkit-scrollbar { width: 12px; height: 12px; }
.map-viewport::-webkit-scrollbar-track { background: #e7e5e4; }
.map-viewport::-webkit-scrollbar-thumb { background: #78716c; border: 2px solid #e7e5e4; border-radius: 8px; }
</style>
