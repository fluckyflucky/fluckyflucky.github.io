<script setup lang="ts">
import { categories } from 'virtual:markdown-index'
import { onMounted, onUnmounted, ref } from 'vue'
import notesIcon from '../icons/home/notes.svg'
import thoughtsIcon from '../icons/home/thoughts.svg'
import imagesIcon from '../icons/home/images.svg'
import toolsIcon from '../icons/home/tools.svg'
import dictionaryIcon from '../icons/home/dictionary.svg'
import gamesIcon from '../icons/home/games.svg'

document.title = '青い夏'

const features = [
  { title: '笔记', description: '学习记录与问题整理', path: '/notes', icon: notesIcon },
  { title: '夏日记忆', description: '生活随笔', path: '/thoughts', icon: thoughtsIcon },
  { title: '图库', description: '旅行照片', path: '/images', icon: imagesIcon },
  { title: '工具箱', description: '格式转换、线路图等', path: '/tools', icon: toolsIcon },
  { title: '词典', description: '日语词汇与例句', path: '/jmdict', icon: dictionaryIcon },
  { title: '小游戏', description: '益智、休闲和桌游', path: '/games', icon: gamesIcon },
]
const recommendations = categories['/thoughts']?.items.slice(0, 3) ?? []
const photoImageRef = ref<HTMLImageElement | null>(null)
const captionRef = ref<HTMLElement | null>(null)
const lensStyle = ref<Record<string, string>>({})
let resizeObserver: ResizeObserver | undefined
let reducedMotion: MediaQueryList | undefined
let reducedTransparency: MediaQueryList | undefined

function syncLens() {
  const photo = photoImageRef.value?.parentElement
  const caption = captionRef.value
  if (!photo || !caption) return
  const box = caption.getBoundingClientRect()
  const frame = photo.getBoundingClientRect()
  lensStyle.value = {
    '--lens-x': `${frame.width - (box.right - frame.left)}px`,
    '--lens-y': `${frame.height - (box.bottom - frame.top)}px`,
    '--photo-w': `${frame.width}px`,
    '--photo-h': `${frame.height}px`,
  }
}

function trackPointer(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || reducedMotion?.matches || reducedTransparency?.matches) return
  const photo = photoImageRef.value?.parentElement
  if (!photo) return
  const caption = captionRef.value
  if (!caption) return
  const bounds = caption.getBoundingClientRect()
  caption.style.setProperty('--shine-x', `${event.clientX - bounds.left}px`)
  caption.style.setProperty('--shine-y', `${event.clientY - bounds.top}px`)
}

onMounted(() => {
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)')
  syncLens()
  resizeObserver = new ResizeObserver(syncLens)
  if (photoImageRef.value?.parentElement) resizeObserver.observe(photoImageRef.value.parentElement)
  if (captionRef.value) resizeObserver.observe(captionRef.value)
})
onUnmounted(() => resizeObserver?.disconnect())
</script>

<template>
  <div class="home-page">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <h1 id="home-title">青い<span>夏</span></h1>
        <p class="hero-subtitle">一直在追逐永无止境的夏。</p>
        <div class="hero-actions">
          <RouterLink to="/thoughts" class="primary-link">夏日记忆 <span aria-hidden="true">↗</span></RouterLink>
          <RouterLink to="/images" class="secondary-link glass-surface">图库 <span aria-hidden="true">→</span></RouterLink>
        </div>
      </div>
      <RouterLink to="/images/2026-05-08-japan-1" class="hero-photo" :style="lensStyle" aria-label="第一次日本行" @pointermove="trackPointer">
        <img ref="photoImageRef" src="/img/home/tokyo-train.webp" alt="东京街头，绿色电车经过商业楼前的高架轨道" width="1400" height="1051" fetchpriority="high" />
        <span class="photo-caption" ref="captionRef">
          <span class="caption-lens" aria-hidden="true">
            <img src="/img/home/tokyo-train.webp" alt="" />
            <svg class="lens-distortion" aria-hidden="true"><filter id="home-glass-warp" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035 .07" numOctaves="1" seed="8" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
          </span>
          <span>
            <span class="photo-meta"><span class="photo-kicker">2024.06</span><span class="photo-location"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>东京</span></span>
            <strong>第一次日本行</strong>
          </span>
        </span>
      </RouterLink>
    </section>

    <section class="explore-section" aria-labelledby="explore-title">
      <div class="section-heading explore-heading">
        <h2 id="explore-title">站内导航</h2>
        <span class="section-rule" aria-hidden="true" />
      </div>
      <div class="feature-grid">
        <RouterLink v-for="feature in features" :key="feature.path" :to="feature.path" class="feature-card">
          <span class="feature-icon"><img :src="feature.icon" alt="" aria-hidden="true" width="24" height="24" /></span>
          <div class="feature-copy">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </RouterLink>
      </div>
    </section>

    <div class="home-bottom">
      <section class="recent-section" aria-labelledby="recent-title">
        <div class="section-heading">
          <h2 id="recent-title">最近随笔</h2>
          <RouterLink to="/thoughts" class="all-link">全部随笔 <span aria-hidden="true">↗</span></RouterLink>
        </div>
        <div class="recent-list">
          <RouterLink v-for="(item, index) in recommendations" :key="item.link" :to="item.link" class="recent-item">
            <span class="recent-number" aria-hidden="true">0{{ index + 1 }}</span>
            <span class="recent-copy">
              <span class="recent-title">{{ item.text }}</span>
              <time :datetime="item.date">{{ item.date }}</time>
            </span>
            <span class="recent-arrow" aria-hidden="true">↗</span>
          </RouterLink>
          <p v-if="!recommendations.length" class="empty-journal">暂无随笔</p>
        </div>
      </section>
      <section class="about-card" aria-labelledby="about-title">
        <div class="about-heading">
          <h2 id="about-title">关于我</h2>
          <span class="about-mark" aria-hidden="true"><img src="/logo.svg" alt="" width="32" height="32" /></span>
        </div>
        <p class="about-intro">Hi，这里是青い夏!</p>
        <p>同济大学计科在读。前后端全栈 / Agent / 游戏开发，喜欢做有意思的事情。</p>
        <p>是个一到夏天就躁动不安，时刻计划着踏上旅途的白日梦想家。</p>
        <a href="https://github.com/fluckyflucky" target="_blank" rel="noopener noreferrer" class="github-link"><svg aria-hidden="true" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.72-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.81c1.02 0 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.83 1.1.83 2.22v3.3c0 .32.19.69.8.57A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0Z" /></svg>GitHub <span aria-hidden="true">↗</span></a>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  --home-accent: #b9e8de;
  --home-muted: #a7bdbf;
  --home-border: rgb(178 213 210 / .14);
  position: relative;
  z-index: 10;
  color: #e9efef;
}

.home-hero {
  display: grid;
  grid-template-columns: minmax(0, .83fr) minmax(0, 1.17fr);
  gap: clamp(32px, 6vw, 84px);
  align-items: center;
  padding: 18px 0 72px;
}

h1 { margin: 0 0 22px; font-size: clamp(76px, 9vw, 126px); line-height: .98; font-weight: 620; letter-spacing: -.075em; }
h1 > span { color: #a1dcd8; display: inline-block; transform: translateY(.12em); }
.hero-subtitle { max-width: 14em; margin-top: 30px; color: #c6d6d5; font-size: clamp(18px, 2vw, 23px); font-weight: 450; letter-spacing: .055em; line-height: 1.75; }
.hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: 38px; }

.primary-link, .secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 46px;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  transition: background .2s, color .2s, border-color .2s;
}

.primary-link { background: var(--home-accent); color: #153e3e; font-weight: 600; }
.primary-link:hover { background: #d3f5ed; }
.secondary-link { color: #dce8e8; }
.secondary-link:hover { color: var(--home-accent); }

.hero-photo {
  position: relative;
  display: block;
  isolation: isolate;
  height: clamp(390px, 39vw, 510px);
  overflow: hidden;
  border: 1px solid #beded638;
  border-radius: 3px;
  background: #163b42;
  box-shadow: 0 24px 64px #00000026;
}

.hero-photo > img { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: 60% center; transition: transform .5s; }
.hero-photo:hover > img { transform: none; }

.photo-caption { position: absolute; inset: auto 20px 20px auto; display: flex; align-items: end; min-height: 0; padding: 15px 19px 14px; color: #fff; border: 1px solid rgb(239 255 255 / .58); border-radius: 13px; background: rgb(17 37 42 / .96); box-shadow: inset 0 1px 0 rgb(255 255 255 / .72), inset 1px 0 0 rgb(255 255 255 / .32), inset 0 -2px 0 rgb(4 25 32 / .25), 0 10px 28px rgb(0 10 15 / .2); isolation: isolate; overflow: hidden; }
.caption-lens { position: absolute; z-index: -1; inset: 0; overflow: hidden; border-radius: inherit; pointer-events: none; }
.caption-lens::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgb(8 28 36 / .25), rgb(4 20 28 / .58)); }
.caption-lens img { position: absolute; right: calc(-1 * var(--lens-x)); bottom: calc(-1 * var(--lens-y)); width: var(--photo-w); height: var(--photo-h); max-width: none; object-fit: cover; object-position: 60% center; transform: scale(1.16); transform-origin: calc(100% - var(--lens-x)) calc(100% - var(--lens-y)); filter: url(#home-glass-warp) saturate(1.12) brightness(1); }
.lens-distortion { position: absolute; width: 0; height: 0; overflow: hidden; }
.photo-caption::after { content: ''; position: absolute; z-index: 0; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(100px circle at var(--shine-x, 50%) var(--shine-y, 50%), rgb(231 255 255 / .34), transparent 72%); transition: opacity .2s; }
.hero-photo:hover .photo-caption::after { opacity: 1; }
.photo-caption::before { content: ''; position: absolute; inset: 1px; pointer-events: none; border-radius: 12px; background: linear-gradient(115deg, rgb(255 255 255 / .22), transparent 34% 73%, rgb(202 250 255 / .15)); }
.photo-caption > span:not(.caption-lens) { position: relative; z-index: 1; }
.photo-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 5px; color: #f1ffff; font-size: 11px; text-shadow: 0 1px 8px #061719; }
.photo-kicker { color: inherit; font-size: inherit; letter-spacing: .12em; }
.photo-location { display: inline-flex; align-items: center; gap: 5px; }
.photo-caption strong { font-size: 17px; font-weight: 550; letter-spacing: .035em; text-shadow: 0 1px 12px #061719; }

.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 22px; }
.section-heading h2, .about-heading h2 { font-size: 20px; font-weight: 600; letter-spacing: .03em; }
.explore-heading { gap: 18px; margin-bottom: 18px; }
.explore-heading h2 { font-size: 15px; }
.section-rule { flex: 1; height: 1px; background: var(--home-border); }
.feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 32px; }

.feature-card {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  min-height: 86px;
  padding: 16px 2px;
  border-bottom: 1px solid var(--home-border);
  transition: border-color .2s;
}

.feature-copy h3 { font-size: 17px; font-weight: 550; letter-spacing: .02em; }
.feature-copy p { margin-top: 7px; color: var(--home-muted); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
.feature-icon { display: grid; place-items: center; width: 24px; height: 24px; opacity: .76; }
.feature-card:hover { border-color: rgb(185 232 222 / .48); }
.feature-card:hover .feature-icon { opacity: 1; }

.home-bottom { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 48px; padding-top: 54px; margin-bottom: 24px; }
.recent-section { padding-top: 5px; }
.all-link { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; color: var(--home-muted); font-size: 12px; white-space: nowrap; }
.all-link:hover { color: var(--home-accent); }
.recent-list { border-top: 1px solid var(--home-border); }
.recent-item { display: flex; align-items: center; gap: 20px; min-height: 80px; padding: 20px 4px; border-bottom: 1px solid var(--home-border); transition: background .2s; }
.recent-item:hover { background: #79d5d108; }
.recent-number { color: #8ea6a9; font-size: 11px; font-variant-numeric: tabular-nums; }
.recent-copy { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; min-width: 0; flex: 1; }
.recent-title { color: #dce8e8; font-size: 16px; line-height: 1.6; overflow-wrap: anywhere; transition: color .2s; }
.recent-item:hover .recent-title { color: var(--home-accent); }
.recent-copy time { flex-shrink: 0; color: var(--home-muted); font-size: 12px; font-variant-numeric: tabular-nums; letter-spacing: .04em; }
.recent-arrow { color: #95b5b7; }

.about-card { display: flex; flex-direction: column; padding: 4px 0 4px 28px; border-left: 1px solid rgb(178 213 210 / .24); }
.about-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; }
.about-mark { display: grid; place-items: center; width: 36px; height: 36px; opacity: .72; }
.about-card > p { margin-top: 12px; color: var(--home-muted); font-size: 14px; line-height: 1.85; }
.about-card > .about-intro { margin: 0; color: #dce8e8; font-size: 15px; }
.github-link { display: flex; gap: 10px; align-items: center; min-height: 44px; margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--home-border); font-size: 13px; color: #d0e0df; }
.github-link:hover { color: var(--home-accent); }
.github-link > span { margin-left: auto; }
.empty-journal { padding: 24px 0; color: var(--home-muted); }

/* Opaque fallback keeps text readable when backdrop filtering is unavailable. */
.glass-surface {
  background: rgb(17 25 29 / .94);
  border: 1px solid rgb(231 244 246 / .16);
  border-top-color: rgb(231 244 246 / .3);
  border-left-color: rgb(231 244 246 / .22);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .06), inset 0 -1px 0 rgb(0 0 0 / .12), 0 8px 24px rgb(0 0 0 / .12);
  transition: background-color .2s, border-color .2s, box-shadow .2s;
}

.secondary-link:hover {
  background-color: rgb(30 40 44 / .94);
  border-color: rgb(231 244 246 / .38);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .12), inset 0 -1px 0 rgb(0 0 0 / .1), 0 10px 28px rgb(0 0 0 / .16);
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .glass-surface {
    background-color: rgb(17 25 29 / .28);
    -webkit-backdrop-filter: blur(18px) saturate(1.25);
    backdrop-filter: blur(18px) saturate(1.25);
  }

  .secondary-link:hover { background-color: rgb(38 48 52 / .4); }
  .photo-caption { background: linear-gradient(140deg, rgb(235 255 255 / .2), rgb(91 137 143 / .15) 48%, rgb(14 39 45 / .25)); }
}

@media (prefers-reduced-transparency: reduce) {
  .photo-caption { background: rgb(17 37 42 / .96); -webkit-backdrop-filter: none; backdrop-filter: none; }
  .caption-lens, .photo-caption::after { display: none; }
}

@media (max-width: 1023px) {
  .home-hero { gap: 32px; }
  .hero-photo { height: 390px; }
  .hero-subtitle { font-size: 19px; }
  .feature-grid { column-gap: 22px; }
  .feature-card { gap: 12px; }
  .feature-copy h3 { font-size: 16px; }
  .home-bottom { gap: 28px; }
  .recent-copy { display: block; }
  .recent-copy time { display: block; margin-top: 5px; }
}

@media (max-width: 767px) {
  .home-hero { grid-template-columns: 1fr; gap: 28px; padding: 12px 0 48px; }
  h1 { margin-bottom: 18px; font-size: clamp(76px, 22vw, 106px); }
  .hero-subtitle { font-size: 20px; }
  .hero-actions { margin-top: 26px; }
  .hero-photo { height: auto; aspect-ratio: 3 / 2; }
  .photo-caption { inset: auto 12px 12px auto; padding: 12px 15px; }
  .photo-caption strong { font-size: 16px; }
  .section-heading { gap: 12px; }
  .section-heading h2, .about-heading h2 { font-size: 19px; }
  .explore-heading h2 { font-size: 14px; }
  .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 20px; }
  .feature-card { align-content: start; gap: 10px; min-height: 100px; padding: 16px 0; }
  .feature-copy p { margin-top: 6px; }
  .home-bottom { grid-template-columns: 1fr; gap: 32px; padding-top: 40px; margin-bottom: 12px; }
  .recent-item { gap: 16px; }
  .about-card { padding: 2px 0 2px 20px; }
}

@media (max-width: 359px) {
  .hero-subtitle { font-size: 18px; }
  .photo-caption { padding: 12px 12px; }
  .photo-caption strong { font-size: 16px; }
  .feature-card { padding: 14px 0; }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-surface { background-color: rgb(17 25 29 / .96); -webkit-backdrop-filter: none; backdrop-filter: none; }
  .secondary-link:hover { background-color: rgb(30 40 44 / .96); }
}

@media (prefers-reduced-motion: reduce) {
  .home-page *, .home-page *::after { transition: none !important; }
  .hero-photo:hover > img { transform: none; }
  .caption-lens, .photo-caption::after { display: none; }
  .photo-caption { background: rgb(17 37 42 / .96); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
</style>
