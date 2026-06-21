<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SideNav from './SideNav.vue'
import PageToC from './PageToC.vue'
import { sidebar } from '../data/sidebar'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)

const navItems = [
  { text: '首页', path: '/' },
  { text: '小笔记', path: '/notes' },
  { text: '夏日记忆', path: '/thoughts' },
  { text: '图库', path: '/images' },
  { text: '工具箱', path: '/tools' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const goTo = (path: string) => {
  sidebarOpen.value = false
  router.push(path)
}

const showSideNav = computed(() => {
  const p = route.path
  return ['/notes', '/thoughts', '/images', '/tools'].some(
    prefix => p === prefix || p.startsWith(prefix + '/')
  )
})

const sideNavGroup = computed(() => {
  const p = route.path
  for (const [prefix, g] of Object.entries(sidebar)) {
    if (p === prefix || p.startsWith(prefix + '/')) {
      return g
    }
  }
  return null
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 bg-stone-950/40 backdrop-blur border-b border-stone-800">
      <div class="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between">
        <button @click="goTo('/')" class="flex items-center gap-2 hover:opacity-80 transition">
          <img :src="'/logo.png'" alt="logo" class="w-7 h-7 rounded" />
          <span class="text-lg font-bold text-stone-100 tracking-wide">青い夏</span>
        </button>

        <nav class="hidden md:flex items-center gap-1">
          <button
            v-for="item in navItems"
            :key="item.path"
            @click="goTo(item.path)"
            :class="[
              'px-3 py-1.5 rounded text-sm transition',
              isActive(item.path)
                ? 'bg-sky-900/40 text-sky-300'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            ]"
          >
            {{ item.text }}
          </button>
        </nav>

        <button
          @click="sidebarOpen = !sidebarOpen"
          class="md:hidden p-2 text-stone-400 hover:text-stone-200"
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Mobile sidebar overlay -->
    <transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/60 md:hidden"
        @click="sidebarOpen = false"
      />
    </transition>

    <!-- Mobile sidebar -->
    <transition name="fade">
      <aside
        v-if="sidebarOpen"
        class="fixed top-14 left-0 z-40 w-64 max-h-[50vh] bg-stone-950 border-r border-b border-stone-800 md:hidden overflow-y-auto rounded-b-lg"
      >
        <nav class="p-4 flex flex-col gap-1">
          <button
            v-for="item in navItems"
            :key="item.path"
            @click="goTo(item.path)"
            :class="[
              'px-4 py-2.5 rounded-lg text-left text-sm transition',
              isActive(item.path)
                ? 'bg-sky-900/40 text-sky-300'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            ]"
          >
            {{ item.text }}
          </button>

          <template v-if="sideNavGroup">
            <hr class="border-stone-800 my-2" />
            <div class="px-4 py-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {{ sideNavGroup.text }}
            </div>
            <button
              v-for="item in sideNavGroup.items"
              :key="item.link"
              @click="goTo(item.link)"
              :class="[
                'px-4 py-2 rounded-lg text-left text-sm transition',
                route.path === item.link
                  ? 'bg-sky-900/40 text-sky-300'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
              ]"
            >
              {{ item.text }}
            </button>
          </template>
        </nav>
      </aside>
    </transition>

    <!-- Main content -->
    <main class="flex-1">
      <div class="max-w-[1440px] mx-auto px-4 py-8 md:py-12">
        <div v-if="showSideNav" class="flex gap-10 justify-center">
          <div class="hidden md:block pt-1">
            <div class="sticky top-20">
              <SideNav />
            </div>
          </div>
          <div class="flex-1 max-w-3xl min-w-0">
            <slot />
          </div>
          <div class="hidden lg:block pt-1">
            <div class="sticky top-20">
              <PageToC />
            </div>
          </div>
        </div>
        <div v-else class="max-w-4xl mx-auto">
          <slot />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-stone-800 py-6">
      <div class="max-w-[1440px] mx-auto px-4 text-center text-sm text-stone-500">
        powered by Vue · 終わらない夏
      </div>
    </footer>
  </div>
</template>
