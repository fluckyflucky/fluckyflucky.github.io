<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

onMounted(() => { document.title = 'JR 新干线与特急列车线路图 · 青い夏' })

const imageUrl = '/img/tools/japan-railways-group-092022.png'
const sourceUrl = 'https://makkiato.gumroad.com/l/JRGroupMap'
const originalWidth = 4961
const originalHeight = 3508
const viewport = ref<HTMLDivElement>()
const scale = ref(1)
const loaded = ref(false)
const failed = ref(false)
const dragging = ref(false)
const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)
let drag: { id: number; x: number; y: number; left: number; top: number } | undefined

async function setScale(value: number) {
  const el = viewport.value
  if (!el) return
  const x = (el.scrollLeft + el.clientWidth / 2) / scale.value
  const y = (el.scrollTop + el.clientHeight / 2) / scale.value
  scale.value = Math.min(2, Math.max(0.05, value))
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

function startDrag(event: PointerEvent) {
  // Touch devices use native scrolling and pinch zoom.
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
  <section class="jr-map">
    <h1 class="text-2xl font-bold mb-2 text-stone-100">JR 新干线与特急列车线路图</h1>
    <p class="text-sm text-stone-400 mb-5">2022 年 9 月版 · 高清原图</p>

    <div class="source-note">
      <p><strong>原图来源 / REF：</strong><a :href="sourceUrl" target="_blank" rel="noopener noreferrer">makkiato · JR Group Map ↗</a></p>
      <p class="text-xs text-stone-400 mt-2">图中署名：R Zhao © 2022 · makkiato.net。非官方示意图，仅供参考；线路与停站信息以铁路公司最新公告为准。</p>
    </div>

    <div class="map-toolbar" role="group" aria-label="地图查看控制">
      <button type="button" :disabled="scale <= 0.05" aria-label="缩小地图" @click="setScale(scale / 1.25)">−</button>
      <output class="zoom-label" aria-live="polite">{{ zoomLabel }}</output>
      <button type="button" :disabled="scale >= 2" aria-label="放大地图" @click="setScale(scale * 1.25)">＋</button>
      <button type="button" @click="setScale(1)">原始大小</button>
      <button type="button" @click="fitMap">查看全图</button>
      <a :href="imageUrl" target="_blank" rel="noopener noreferrer">打开原图 ↗</a>
    </div>
    <p id="jr-map-help" class="text-xs text-stone-400 mb-3">在窗口内横向、纵向滚动，或按住鼠标拖动查看；手机可滑动查看。原图 4961 × 3508，未压缩。</p>
    <p v-if="!loaded && !failed" role="status" class="text-sm text-stone-400 mb-3">正在加载高清原图…</p>
    <p v-if="failed" role="alert" class="text-sm text-amber-300 mb-3">图片加载失败，请刷新重试，或通过上方来源链接查看。</p>
    <div
      ref="viewport"
      class="map-viewport"
      :class="{ dragging }"
      tabindex="0"
      role="region"
      aria-label="JR 铁路线路图滚动查看窗口"
      aria-describedby="jr-map-help"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
    >
      <img
        :src="imageUrl"
        alt="Japan Railways Group 新干线与特急列车线路图，2022 年 9 月版，作者 R Zhao / makkiato"
        :width="originalWidth * scale"
        :height="originalHeight * scale"
        :style="{ width: `${originalWidth * scale}px`, height: `${originalHeight * scale}px` }"
        draggable="false"
        @load="loaded = true; failed = false"
        @error="failed = true"
      />
    </div>
  </section>
</template>

<style scoped>
.source-note { padding: 16px; border: 1px solid #387883; border-radius: 12px; background: #14313b; color: #c3e7ed; font-size: 14px; line-height: 1.7; }
.jr-map a { color: #7dd3fc; text-decoration: underline; text-underline-offset: 3px; }
.jr-map a:hover { color: #bae6fd; }
.map-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 20px 0 12px; font-size: 13px; }
.map-toolbar button { min-width: 44px; min-height: 44px; padding: 8px 12px; border: 1px solid #44403c; border-radius: 8px; background: #1c1917; color: #e7e5e4; }
.map-toolbar button:hover:not(:disabled) { border-color: #7dd3fc; }
.map-toolbar button:disabled { opacity: .4; cursor: default; }
.map-toolbar a { padding: 12px 4px; }
.zoom-label { min-width: 44px; text-align: center; color: #d6d3d1; font-variant-numeric: tabular-nums; }
.map-viewport { width: 100%; height: 65vh; height: 65dvh; overflow: auto; border: 1px solid #57534e; border-radius: 12px; background: #fff; cursor: grab; overscroll-behavior: contain; }
.map-viewport.dragging { cursor: grabbing; }
.map-viewport img { display: block; max-width: none; user-select: none; }
.map-viewport::-webkit-scrollbar { width: 12px; height: 12px; }
.map-viewport::-webkit-scrollbar-track { background: #e7e5e4; }
.map-viewport::-webkit-scrollbar-thumb { background: #78716c; border: 2px solid #e7e5e4; border-radius: 8px; }
</style>
