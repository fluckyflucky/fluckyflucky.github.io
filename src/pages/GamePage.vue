<script setup lang="ts">
import { computed, defineAsyncComponent, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { games } from '../games/registry'

const route = useRoute()
const game = computed(() => games.find(item => item.id === route.params.id))
const player = computed(() => game.value ? defineAsyncComponent(game.value.load) : null)
watchEffect(() => { document.title = `${game.value?.title ?? '游戏未找到'} · 青い夏` })
</script>

<template>
  <div class="relative z-10 max-w-3xl mx-auto">
    <RouterLink to="/games" class="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-cyan-300 transition-colors mb-7 rounded focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-4">
      <span aria-hidden="true">←</span> 小游戏
    </RouterLink>
    <template v-if="game && player">
      <Suspense :key="game.id">
        <component :is="player" v-bind="game.props" />
        <template #fallback>
          <div role="status" class="text-center py-20 text-stone-400">游戏准备中…</div>
        </template>
      </Suspense>
    </template>
    <div v-else class="text-center py-20">
      <h1 class="text-xl font-semibold text-stone-100">这款游戏还没上架</h1>
      <p class="text-sm text-stone-400 mt-3">回小游戏区看看吧。</p>
    </div>
  </div>
</template>
