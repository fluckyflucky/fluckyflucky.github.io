<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

document.title = '青い夏'

const features = [
  {
    title: '笔记',
    desc: '造轮子时的笔记。主要是技术实践、学习心得',
    path: '/notes',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: '夏日记忆',
    desc: '一些突如其来的想法、随笔。非技术性内容为主',
    path: '/thoughts',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    title: '图库',
    desc: '镜头下那些转瞬即逝的美。未来也考虑把画放在这里。',
    path: '/images',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    title: '工具箱',
    desc: '纯前端开发小工具，JSON 格式化、Base64 编解码、时间戳转换等。',
    path: '/tools',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: '词典',
    desc: 'JMdict 日英中词典，支持搜索与单词卡片学习。',
    path: '/jmdict',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
]

const recommendations = [
  {
    title: '[后端] JSON 反序列化中 TypeReference 的使用',
    path: '/notes/jackson-type-reference',
    date: '2025-12-29',
  },
  {
    title: '[后端] Gin 框架分层：经典的洋葱模型',
    path: '/notes/gin-layered-architecture',
    date: '2025-09-15',
  },
]
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
"
        @click="router.push(f.path)"
      >
        <div class="flex items-start gap-3.5">
          <span class="mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                       bg-cyan-500/[0.08] text-cyan-400
                       group-hover:bg-cyan-500/[0.15] group-hover:text-cyan-300
                       transition-all duration-300">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" :d="f.icon" />
            </svg>
          </span>
          <div class="min-w-0">
            <h2 class="text-[15px] font-semibold text-stone-200 mb-1">{{ f.title }}</h2>
            <p class="text-[13px] text-stone-400 leading-relaxed">{{ f.desc }}</p>
          </div>
          <svg class="w-4 h-4 shrink-0 mt-1 text-stone-600 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all duration-300 self-center opacity-30 group-hover:opacity-100"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </section>

    <!-- Divider -->
    <div class="flex items-center gap-4 px-4 mt-10 sm:mt-14 mb-8 sm:mb-12 md:px-0">
      <span class="flex-1 h-px bg-stone-800" />
      <span class="text-stone-700 text-xs tracking-widest">RECOMMENDED</span>
      <span class="flex-1 h-px bg-stone-800" />
    </div>

    <!-- Recommendation -->
    <section class="px-4 md:px-0">
      <h2 class="text-lg font-semibold text-stone-200 mb-1">推荐阅读</h2>
      <p class="text-sm text-stone-500 mb-5">如果你不知道从哪里开始，可以看看：</p>
      <div class="space-y-1">
        <a
          v-for="item in recommendations"
          :key="item.path"
          :href="'#' + item.path"
          class="group flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl transition-all duration-200
                 hover:bg-white/[0.04]"
          @click.prevent="router.push(item.path)"
        >
          <span class="shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-500/40
                       group-hover:bg-cyan-400 group-hover:shadow-[0_0_6px_rgba(34,211,238,0.4)]
                       transition-all duration-300" />
          <span class="text-sm text-stone-300 group-hover:text-stone-100 transition-colors truncate">
            {{ item.title }}
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
