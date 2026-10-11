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
  { title: '笔记', path: '/notes', icon: notesIcon },
  { title: '夏日记忆', path: '/thoughts', icon: thoughtsIcon },
  { title: '图库', path: '/images', icon: imagesIcon },
  { title: '工具箱', path: '/tools', icon: toolsIcon },
  { title: '词典', path: '/jmdict', icon: dictionaryIcon },
  { title: '小游戏', path: '/games', icon: gamesIcon },
]
const recommendations = categories['/thoughts']?.items.slice(0, 3) ?? []
</script>

<template>
  <div class="home-page">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="eyebrow"><span class="summer-dot" /> explorer · recorder · creator</p>
        <h1 id="home-title">青い<span>夏</span></h1>
        <p class="hero-subtitle">一直在追逐永无止境的夏。</p>
        <div class="hero-actions">
          <RouterLink to="/thoughts" class="primary-link">夏日记忆 <span aria-hidden="true">↗</span></RouterLink>
          <RouterLink to="/images" class="secondary-link">图库 <span aria-hidden="true">→</span></RouterLink>
        </div>
      </div>
      <RouterLink to="/images/2026-05-08-japan-1" class="hero-photo" aria-label="第一次日本行">
        <img src="/img/home/tokyo-train.webp" alt="东京街头，绿色电车经过商业楼前的高架轨道" width="1400" height="1051" fetchpriority="high" />
        <span class="photo-caption"><span><span class="photo-kicker">2024.06</span><strong>第一次日本行</strong></span><span class="photo-arrow" aria-hidden="true">↗</span></span>
      </RouterLink>
    </section>

    <section class="feature-grid" aria-label="内容导航">
      <RouterLink v-for="feature in features" :key="feature.path" :to="feature.path" class="feature-card">
        <span class="feature-icon"><img :src="feature.icon" alt="" aria-hidden="true" width="24" height="24" /></span>
        <h2>{{ feature.title }}</h2>
        <span class="feature-arrow" aria-hidden="true">↗</span>
      </RouterLink>
    </section>

    <div class="home-bottom">
      <section class="recent-section" aria-labelledby="recent-title">
        <div class="section-heading"><h2 id="recent-title">最近随笔</h2><RouterLink to="/thoughts" class="all-link">全部 <span aria-hidden="true">↗</span></RouterLink></div>
        <div class="recent-list">
          <RouterLink v-for="(item, index) in recommendations" :key="item.link" :to="item.link" class="recent-item">
            <span class="recent-number">0{{ index + 1 }}</span>
            <span class="recent-copy"><span class="recent-title">{{ item.text }}</span><time :datetime="item.date">{{ item.date }}</time></span>
            <span class="recent-arrow" aria-hidden="true">↗</span>
          </RouterLink>
          <p v-if="!recommendations.length" class="empty-journal">暂无随笔</p>
        </div>
      </section>
      <section class="about-card" aria-labelledby="about-title">
        <h2 id="about-title">关于我</h2>
        <p>同济大学计科大三在读，Agent / 前端 / 后端 / 移动开发</p>
        <p>爱旅行、摄影、做有意思的事情，一直在追逐永无止境的夏。</p>
        <a href="https://github.com/fluckyflucky" target="_blank" rel="noopener noreferrer" class="github-link"><svg aria-hidden="true" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.72-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 5.81c1.02 0 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.83 1.1.83 2.22v3.3c0 .32.19.69.8.57A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0Z" /></svg>GitHub <span aria-hidden="true">↗</span></a>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-page { position: relative; z-index: 10; color: #e9efef; }
.home-hero { display: grid; grid-template-columns: 1.1fr 1fr; gap: 64px; align-items: center; padding: 38px 0 68px; }
.eyebrow { text-transform: uppercase; display: flex; align-items: center; gap: 9px; color: #adc5c8; font-size: 10px; font-weight: 500; letter-spacing: .16em; }
.summer-dot { width: 6px; height: 6px; background: #79d5d1; border-radius: 50%; box-shadow: 0 0 12px #79d5d140; }
h1 { margin: 28px 0 20px; font-size: clamp(64px, 6.5vw, 92px); line-height: 1.16; font-weight: 650; letter-spacing: -.045em; }
h1 > span:first-child { color: #a1dcd8; }

.hero-subtitle { font-size: 23px; font-weight: 500; letter-spacing: .04em; }

.hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 25px; margin-top: 36px; }
.primary-link, .secondary-link { display: inline-flex; align-items: center; justify-content: center; gap: 20px; min-height: 46px; font-size: 14px; transition: background .2s, color .2s; }
.primary-link { padding: 0 19px; border-radius: 8px; background: #b9e8de; color: #153e3e; font-weight: 600; }
.primary-link:hover { background: #d3f5ed; }
.secondary-link { color: #c1d1d2; }
.secondary-link:hover { color: #b9e8de; }

.hero-photo { position: relative; display: block; isolation: isolate; height: 410px; overflow: hidden; border-radius: 18px; background: #163b42; border: 1px solid #beded625; box-shadow: 0 22px 65px #00000024; }
.hero-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, #071c2745, transparent 38%, #071c27c9); z-index: -1; }
.hero-photo > img { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: 60% center; transition: transform .5s; }
.hero-photo:hover > img { transform: scale(1.035); }

.photo-caption { position: absolute; bottom: 27px; left: 27px; right: 27px; display: flex; justify-content: space-between; align-items: flex-end; gap: 10px; color: #fff; }
.photo-arrow { font-size: 24px; }
.photo-kicker { display: block; font-size: 10px; letter-spacing: .12em; margin-bottom: 10px; }
.photo-caption strong { font-size: 21px; font-weight: 500; letter-spacing: .035em; }

.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 22px; }
.section-heading h2 { display: flex; align-items: center; gap: 15px; font-size: 19px; font-weight: 600; white-space: nowrap; }

.feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.feature-card { display: flex; align-items: center; gap: 16px; min-height: 96px; padding: 22px 24px; border: 1px solid #b2d5d21c; border-radius: 12px; background: #102326a6; transition: background .2s, border-color .2s; }
.feature-card:hover { background: #18363aca; border-color: #91d8d55c; }

.feature-card h2 { flex: 1; min-width: 0; font-size: 18px; font-weight: 550; }
.feature-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 9px; background: #79d5d110; }
.feature-icon img { opacity: .85; }

.feature-arrow { color: #8daeb0; font-size: 18px; transition: color .2s; }
.feature-card:hover .feature-arrow { color: #b9e8de; }

.home-bottom { margin-bottom: 24px; display: grid; grid-template-columns: 1.35fr 1fr; gap: 54px; padding-top: 60px; }
.recent-section { padding-top: 5px; }
.all-link { display: inline-flex; align-items: center; gap: 9px; min-height: 44px; color: #b5c9c9; font-size: 12px; white-space: nowrap; }
.all-link:hover { color: #b9e8de; }
.recent-list { border-top: 1px solid #b2d5d21c; }
.recent-item { display: flex; align-items: center; gap: 20px; padding: 20px 4px; min-height: 85px; border-bottom: 1px solid #b2d5d21c; transition: background .2s; }
.recent-item:hover { background: #79d5d108; }
.recent-number { color: #8ea6a9; font-size: 11px; font-variant-numeric: tabular-nums; }
.recent-copy { min-width: 0; flex: 1; }
.recent-title { display: block; color: #dce8e8; font-size: 16px; overflow-wrap: anywhere; }
.recent-copy time { display: block; margin-top: 6px; color: #9baeb0; font-size: 11px; letter-spacing: .04em; }
.recent-arrow { color: #95b5b7; }
.about-card { padding: 30px; background: linear-gradient(140deg, #153033ce, #112224cc); border: 1px solid #b2d5d225; border-radius: 14px; }
.about-card h2 { margin: 0 0 16px; font-size: 22px; font-weight: 550; }
.about-card > p { font-size: 13px; color: #b4c3c5; line-height: 1.9; margin-top: 10px; }
.github-link { display: inline-flex; gap: 10px; align-items: center; min-height: 44px; margin-top: 16px; font-size: 13px; color: #d0e0df; }
.github-link:hover { color: #b9e8de; }
.github-link > span { margin-left: 8px; }

.empty-journal { padding: 24px 0; color: #acbabc; }
@media (max-width: 1023px) { .home-hero { gap: 32px; } .hero-photo { height: 380px; } .hero-subtitle { font-size: 19px; } .home-bottom { gap: 28px; } .feature-card { padding: 20px; } }
@media (max-width: 767px) { .home-hero { grid-template-columns: 1fr; padding: 16px 0 40px; gap: 32px; } h1 { font-size: 72px; margin-top: 25px; } .hero-subtitle { font-size: 21px; } .hero-photo { height: 310px; } .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .feature-card { padding: 19px 14px; gap: 8px; min-height: 84px; } .feature-card h2 { font-size: 16px; white-space: nowrap; } .feature-icon { width: 30px; height: 30px; } .home-bottom { grid-template-columns: 1fr; gap: 35px; padding-top: 40px; } .section-heading { gap: 12px; } .section-heading h2 { font-size: 18px; gap: 10px; } .about-card > p { font-size: 16px; } }
@media (max-width: 389px) { .eyebrow { font-size: 9px; letter-spacing: .1em; } .hero-photo { height: 280px; } }
@media (prefers-reduced-motion: reduce) { .home-page *, .home-page *::after { transition: none; } .hero-photo:hover > img { transform: none; } }
</style>
