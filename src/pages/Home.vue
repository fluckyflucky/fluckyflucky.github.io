<script setup lang="ts">
import { useRouter } from 'vue-router'
import { categories } from 'virtual:markdown-index'
import notesIcon from '../icons/home/notes.svg'
import thoughtsIcon from '../icons/home/thoughts.svg'
import imagesIcon from '../icons/home/images.svg'
import toolsIcon from '../icons/home/tools.svg'
import dictionaryIcon from '../icons/home/dictionary.svg'
import gamesIcon from '../icons/home/games.svg'

const router = useRouter()

document.title = '青い夏'

const features = [
  {
    title: '笔记',
    path: '/notes',
    icon: notesIcon,
  },
  {
    title: '夏日记忆',
    path: '/thoughts',
    icon: thoughtsIcon,
  },
  {
    title: '图库',
    path: '/images',
    icon: imagesIcon,
  },
  {
    title: '工具箱',
    path: '/tools',
    icon: toolsIcon,
  },
  {
    title: '词典',
    path: '/jmdict',
    icon: dictionaryIcon,
  },
  {
    title: '小游戏',
    path: '/games',
    icon: gamesIcon,
  },
]

const recommendations = categories['/thoughts']?.items.slice(0, 2) ?? []
</script>

<template>
  <div class="relative z-10 max-w-3xl mx-auto">
    <!-- Hero -->
    <section class="text-center pt-12 sm:pt-16 md:pt-24 pb-8 sm:pb-10 md:pb-14 px-4">
      <h1 class="hero-name text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[0.06em]">青い夏</h1>
      <div class="flex items-center justify-center gap-2 sm:gap-4 mt-5">
        <span class="block w-6 sm:w-10 h-px bg-gradient-to-r from-transparent to-cyan-500/40" />
        <p class="text-xs sm:text-sm font-light tracking-[0.2em] sm:tracking-[0.25em] text-stone-400 uppercase">
          explorer · recorder · creator
        </p>
        <span class="block w-6 sm:w-10 h-px bg-gradient-to-l from-transparent to-cyan-500/40" />
      </div>
    </section>

    <!-- Feature cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 md:px-0">
      <button
        v-for="f in features"
        :key="f.path"
        class="group text-left p-5 rounded-2xl border cursor-pointer transition-all duration-300
               bg-white/[0.025] border-white/[0.06]
               hover:bg-white/[0.05] hover:border-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/[0.04]
               focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400
"
        @click="router.push(f.path)"
      >
        <div class="flex items-center gap-3.5">
          <span class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                       bg-cyan-500/[0.08] group-hover:bg-cyan-500/[0.15]
                       transition-colors duration-300">
            <img :src="f.icon" alt="" aria-hidden="true" class="w-6 h-6" />
          </span>
          <h2 class="min-w-0 flex-1 text-[19px] font-semibold text-stone-200">{{ f.title }}</h2>
          <svg class="w-4 h-4 shrink-0 text-stone-600 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all duration-300 opacity-30 group-hover:opacity-100"
               aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </section>

    <!-- Divider -->
    <div class="flex items-center gap-4 px-4 mt-10 sm:mt-14 mb-8 sm:mb-12 md:px-0">
      <span class="flex-1 h-px bg-stone-800" />
      <span class="text-stone-700 text-xs tracking-widest">RECENT</span>
      <span class="flex-1 h-px bg-stone-800" />
    </div>

    <!-- Recent thoughts -->
    <section class="px-4 md:px-0">
      <h2 class="text-lg font-semibold text-stone-200 mb-1">最近随笔</h2>
      <p class="text-sm text-stone-500 mb-5">最近写的一些文字：</p>
      <div class="space-y-1">
        <a
          v-for="item in recommendations"
          :key="item.link"
          :href="'#' + item.link"
          class="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl transition-all duration-200
                 hover:bg-white/[0.04]"
          @click.prevent="router.push(item.link)"
        >
          <span class="shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-500/40
                       group-hover:bg-cyan-400 group-hover:shadow-[0_0_6px_rgba(34,211,238,0.4)]
                       transition-all duration-300" />
          <span class="text-sm text-stone-300 group-hover:text-stone-100 transition-colors truncate">
            {{ item.text }}
          </span>
          <span class="shrink-0 text-xs text-stone-600 ml-auto">{{ item.date }}</span>
        </a>
      </div>
    </section>

    <!-- Divider -->
    <div class="flex items-center gap-4 px-4 mt-10 sm:mt-14 mb-8 sm:mb-12 md:px-0">
      <span class="flex-1 h-px bg-stone-800" />
      <span class="text-stone-700 text-xs tracking-widest">ABOUT</span>
      <span class="flex-1 h-px bg-stone-800" />
    </div>

    <!-- About me -->
    <section class="px-4 pb-10 md:px-0 md:pb-20">
      <h3 class="text-lg font-semibold text-stone-200 mb-4">关于我</h3>
      <div class="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 space-y-3">
        <p class="text-sm text-stone-400 leading-relaxed">
          同济大学计科大三在读，Agent / 前端 / 后端 / 移动开发
        </p>
        <p class="text-sm text-stone-400 leading-relaxed">
          爱旅行、摄影、做有意思的事情，一直在追逐永无止境的夏。
        </p>
        <a
          href="https://github.com/fluckyflucky"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full
                 bg-stone-800/60 border border-stone-700/50
                 text-sm text-stone-300 hover:text-stone-100
                 hover:bg-stone-700/60 hover:border-stone-600/50
                 transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-name {
  color: #e7e5e4;
  /* stone-200 */
}
</style>
