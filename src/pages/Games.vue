<script setup lang="ts">
import { games } from '../games/registry'

document.title = '小游戏 · 青い夏'
</script>

<template>
  <div class="relative z-10 max-w-3xl mx-auto">
    <header class="pt-5 sm:pt-10 pb-8 sm:pb-10">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-wide text-stone-100">小游戏</h1>
    </header>

    <div class="flex items-center gap-3 mb-5">
      <h2 class="text-sm font-medium text-stone-300">全部游戏</h2>
      <span class="text-xs text-stone-500">{{ games.length }} 款游戏</span>
      <span class="flex-1 h-px bg-stone-800" />
    </div>

    <section aria-label="游戏列表" class="grid sm:grid-cols-2 gap-4">
      <RouterLink
        v-for="game in games"
        :key="game.id"
        :to="`/games/${game.id}`"
        class="game-card group rounded-2xl overflow-hidden border border-white/[0.08] bg-stone-900/50
               hover:border-cyan-500/40 transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-4"
      >
        <div class="game-cover relative h-44 sm:h-48 overflow-hidden flex items-center justify-center" :style="{ '--cover-accent': game.accent ?? '#67e8f9' }">
          <div aria-hidden="true" class="cover-grid absolute inset-0" />
          <div v-if="game.coverImages" class="cover-pieces relative flex items-center justify-center gap-3 group-hover:scale-105 transition-transform duration-300" aria-hidden="true">
            <img v-for="(src, index) in game.coverImages" :key="src" :src="src" alt="" :class="`cover-piece cover-piece-${index}`" loading="lazy" />
          </div>
          <span v-else class="relative text-6xl font-bold tracking-tight text-cyan-100 group-hover:scale-105 transition-transform duration-300">{{ game.coverText }}</span>
          <span class="absolute left-4 top-4 rounded-full border border-cyan-400/20 bg-stone-950/40 px-2.5 py-1 text-[11px] text-cyan-200">{{ game.category }}</span>
        </div>
        <div class="p-5">
          <h3 class="font-semibold text-lg text-stone-100">{{ game.title }}</h3>
          <p class="mt-2 text-sm text-stone-400 leading-relaxed">{{ game.description }}</p>
          <p class="mt-4 text-xs text-stone-500">{{ game.controls }}</p>
          <div class="mt-5 flex items-center justify-between text-sm font-medium text-cyan-300">
            <span>开始玩</span>
            <span aria-hidden="true" class="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </RouterLink>

    </section>
  </div>
</template>

<style scoped>
.game-cover { background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--cover-accent) 16%, transparent), transparent 75%), #101e24; }
.cover-piece { object-fit: cover; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--cover-accent) 40%, transparent); box-shadow: 0 6px 20px rgb(0 0 0 / 0.2); }
.cover-piece-0 { width: 54px; height: 54px; }
.cover-piece-1 { width: 76px; height: 76px; }
.cover-piece-2 { width: 104px; height: 104px; }
.cover-grid {
  background-image: linear-gradient(rgb(103 232 249 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(103 232 249 / 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(transparent, black);
}
@media (prefers-reduced-motion: reduce) {
  .game-card * { transition: none; }
}
</style>
