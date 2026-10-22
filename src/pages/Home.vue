<script setup lang="ts">
import { categories } from 'virtual:markdown-index'
import notesIcon from '../icons/home/notes.svg'
import thoughtsIcon from '../icons/home/thoughts.svg'
import imagesIcon from '../icons/home/images.svg'
import toolsIcon from '../icons/home/tools.svg'
import dictionaryIcon from '../icons/home/dictionary.svg'
import gamesIcon from '../icons/home/games.svg'

document.title = '青い夏'

const features = [
  { title: '笔记', description: '把学到的，慢慢记下来', path: '/notes', icon: notesIcon },
  { title: '夏日记忆', description: '收藏日常里的细碎心事', path: '/thoughts', icon: thoughtsIcon },
  { title: '图库', description: '用镜头留住沿途的风景', path: '/images', icon: imagesIcon },
  { title: '工具箱', description: '给日常多一点便利', path: '/tools', icon: toolsIcon },
  { title: '词典', description: '遇见一个新的日语词汇', path: '/jmdict', icon: dictionaryIcon },
  { title: '小游戏', description: '在这里，轻松玩一会儿', path: '/games', icon: gamesIcon },
]
const recommendations = categories['/thoughts']?.items.slice(0, 3) ?? []
</script>

<template>
  <div class="home-page">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="eyebrow"><span class="summer-dot" aria-hidden="true" /> explorer · recorder · creator</p>
        <h1 id="home-title">青い<span>夏</span></h1>
        <p class="hero-subtitle">一直在追逐永无止境的夏。</p>
        <p class="hero-note">关于技术、生活，和路上的风景。</p>
        <div class="hero-actions">
          <RouterLink to="/thoughts" class="primary-link">夏日记忆 <span aria-hidden="true">↗</span></RouterLink>
          <RouterLink to="/images" class="secondary-link">图库 <span aria-hidden="true">→</span></RouterLink>
        </div>
      </div>
      <RouterLink to="/images/2026-05-08-japan-1" class="hero-photo" aria-label="第一次日本行">
        <img src="/img/home/tokyo-train.webp" alt="东京街头，绿色电车经过商业楼前的高架轨道" width="1400" height="1051" fetchpriority="high" />
        <span class="photo-location">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
          日本 · 东京
        </span>
        <span class="photo-caption">
          <span><span class="photo-kicker">2024.06 / 旅途记录</span><strong>第一次日本行</strong></span>
          <span class="photo-arrow" aria-hidden="true">↗</span>
        </span>
      </RouterLink>
    </section>

    <section class="explore-section" aria-labelledby="explore-title">
      <div class="section-heading explore-heading">
        <h2 id="explore-title">随处逛逛</h2>
        <span class="section-rule" aria-hidden="true" />
        <span class="section-label" aria-hidden="true">EXPLORE</span>
      </div>
      <div class="feature-grid">
        <RouterLink v-for="feature in features" :key="feature.path" :to="feature.path" class="feature-card">
          <span class="feature-icon"><img :src="feature.icon" alt="" aria-hidden="true" width="24" height="24" /></span>
          <div class="feature-copy">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
          <span class="feature-arrow" aria-hidden="true">↗</span>
        </RouterLink>
      </div>
    </section>

    <div class="home-bottom">
      <section class="recent-section" aria-labelledby="recent-title">
        <div class="section-heading">
          <div><span class="section-label" aria-hidden="true">JOURNAL</span><h2 id="recent-title">最近随笔</h2></div>
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
          <div><span class="section-label" aria-hidden="true">ABOUT ME</span><h2 id="about-title">关于我</h2></div>
          <span class="about-mark" aria-hidden="true"><img src="/logo.svg" alt="" width="32" height="32" /></span>
        </div>
        <p class="about-intro">同济大学计科大三在读</p>
        <p class="about-interests">Agent / 前端 / 后端 / 移动开发</p>
        <p>爱旅行、摄影、做有意思的事情，一直在追逐永无止境的夏。</p>
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

.home-page::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 70% 12%, #79d5d10a, transparent 48%);
}

.home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
  gap: 64px;
  align-items: center;
  padding: 28px 0 56px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--home-muted);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.summer-dot { flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; background: #a1dcd8; box-shadow: 0 0 12px #79d5d140; }
h1 { margin: 26px 0 20px; font-size: clamp(64px, 6.5vw, 92px); line-height: 1.16; font-weight: 650; letter-spacing: -.045em; }
h1 > span { color: #a1dcd8; }
.hero-subtitle { font-size: 23px; font-weight: 500; letter-spacing: .035em; line-height: 1.6; }
.hero-note { margin-top: 12px; color: var(--home-muted); font-size: 14px; line-height: 1.8; letter-spacing: .04em; }
.hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: 32px; }

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
.secondary-link { border-color: var(--home-border); color: #c1d1d2; }
.secondary-link:hover { background: #79d5d10c; border-color: #91d8d55c; color: var(--home-accent); }

.hero-photo {
  position: relative;
  display: block;
  isolation: isolate;
  height: 410px;
  overflow: hidden;
  border: 1px solid #beded638;
  border-radius: 16px;
  background: #163b42;
  box-shadow: 0 24px 64px #00000026;
}

.hero-photo::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, #071c271f 35%, #071c27e6); }
.hero-photo > img { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: 60% center; transition: transform .5s; }
.hero-photo:hover > img { transform: scale(1.035); }

.photo-location {
  position: absolute;
  top: 20px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid #e9efef30;
  border-radius: 6px;
  background: #0c252bd9;
  color: #e9efef;
  font-size: 11px;
  letter-spacing: .04em;
}

.photo-caption { position: absolute; bottom: 26px; left: 26px; right: 26px; display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; color: #fff; }
.photo-kicker { display: block; margin-bottom: 9px; color: #d0e0df; font-size: 11px; letter-spacing: .12em; }
.photo-caption strong { font-size: 22px; font-weight: 500; letter-spacing: .035em; }
.photo-arrow { display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px; border: 1px solid #e9efef50; border-radius: 50%; font-size: 21px; transition: background .2s, border-color .2s; }
.hero-photo:hover .photo-arrow { background: #b9e8de20; border-color: var(--home-accent); }

.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 22px; }
.section-heading h2, .about-heading h2 { font-size: 20px; font-weight: 600; letter-spacing: .03em; }
.section-label { display: block; color: var(--home-muted); font-size: 10px; line-height: 1.5; letter-spacing: .16em; }
.section-heading .section-label, .about-heading .section-label { margin-bottom: 8px; }
.explore-heading { gap: 18px; margin-bottom: 18px; }
.explore-heading h2 { font-size: 15px; }
.explore-heading > .section-label { margin: 0; font-size: 9px; }
.section-rule { flex: 1; height: 1px; background: var(--home-border); }
.feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }

.feature-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 15px;
  min-height: 108px;
  padding: 22px;
  border: 1px solid var(--home-border);
  border-radius: 12px;
  background: linear-gradient(115deg, #17313596, #102326a6);
  transition: background .2s, border-color .2s;
}

.feature-card:hover, .feature-card:focus-visible { background: #18363aca; border-color: #91d8d55c; }
.feature-copy h3 { font-size: 17px; font-weight: 550; letter-spacing: .02em; }
.feature-copy p { margin-top: 7px; color: var(--home-muted); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.feature-icon { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid #a1dcd814; border-radius: 11px; background: #79d5d10b; }
.feature-arrow { color: #8daeb0; font-size: 18px; transition: color .2s; }
.feature-card:hover .feature-arrow { color: var(--home-accent); }

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
.recent-copy time { flex-shrink: 0; color: var(--home-muted); font-size: 11px; font-variant-numeric: tabular-nums; letter-spacing: .04em; }
.recent-arrow { color: #95b5b7; }

.about-card { display: flex; flex-direction: column; padding: 28px; border: 1px solid var(--home-border); border-radius: 14px; background: linear-gradient(140deg, #18383acc, #102426b3); }
.about-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; }
.about-mark { display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid var(--home-border); border-radius: 12px; background: #b9e8de08; }
.about-card > p { margin-top: 12px; color: var(--home-muted); font-size: 14px; line-height: 1.85; }
.about-card > .about-intro { margin: 0; color: #dce8e8; font-size: 15px; }
.about-card > .about-interests { margin-top: 4px; font-size: 12px; }
.github-link { display: flex; gap: 10px; align-items: center; min-height: 44px; margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--home-border); font-size: 13px; color: #d0e0df; }
.github-link:hover { color: var(--home-accent); }
.github-link > span { margin-left: auto; }
.empty-journal { padding: 24px 0; color: var(--home-muted); }

@media (max-width: 1023px) {
  .home-hero { gap: 32px; }
  .hero-photo { height: 380px; }
  .hero-subtitle { font-size: 19px; }
  .feature-card { gap: 12px; padding: 18px; }
  .feature-icon { width: 34px; height: 34px; }
  .feature-copy h3 { font-size: 16px; }
  .home-bottom { gap: 28px; }
  .recent-copy { display: block; }
  .recent-copy time { display: block; margin-top: 5px; }
}

@media (max-width: 767px) {
  .home-hero { grid-template-columns: 1fr; gap: 32px; padding: 12px 0 36px; }
  h1 { margin: 22px 0 18px; font-size: clamp(64px, 18vw, 80px); }
  .hero-subtitle { font-size: 20px; }
  .hero-note { margin-top: 8px; font-size: 13px; }
  .hero-actions { margin-top: 26px; }
  .hero-photo { height: auto; aspect-ratio: 1.2; }
  .photo-location { top: 16px; left: 16px; }
  .photo-caption { bottom: 22px; left: 22px; right: 22px; }
  .photo-caption strong { font-size: 20px; }
  .section-heading { gap: 12px; }
  .section-heading h2, .about-heading h2 { font-size: 19px; }
  .explore-heading h2 { font-size: 14px; }
  .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .feature-card { grid-template-columns: minmax(0, 1fr) auto; align-content: start; gap: 14px 8px; padding: 18px 16px; }
  .feature-icon { grid-column: 1; grid-row: 1; }
  .feature-arrow { grid-column: 2; grid-row: 1; align-self: center; }
  .feature-copy { grid-column: 1 / -1; }
  .feature-copy p { margin-top: 6px; }
  .home-bottom { grid-template-columns: 1fr; gap: 32px; padding-top: 40px; margin-bottom: 12px; }
  .recent-item { gap: 16px; }
  .about-card { padding: 24px; }
}

@media (max-width: 359px) {
  .eyebrow { font-size: 9px; letter-spacing: .1em; }
  .hero-subtitle { font-size: 18px; }
  .feature-card { padding: 16px 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .home-page *, .home-page *::after { transition: none; }
  .hero-photo:hover > img { transform: none; }
}
</style>
