<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SideNav from './SideNav.vue'
import PageToC from './PageToC.vue'
import { sidebar } from '../data/sidebar'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)
watch(() => route.path, () => { sidebarOpen.value = false })

const navItems = [
  { text: '首页', path: '/' },
  { text: '笔记', path: '/notes' },
  { text: '夏日记忆', path: '/thoughts' },
  { text: '图库', path: '/images' },
  { text: '工具箱', path: '/tools' },
  { text: '词典', path: '/jmdict' },
  { text: '小游戏', path: '/games' },
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
    <header class="site-header sticky top-0 z-50">
      <div class="header-inner mx-auto px-4 flex items-center justify-between">
        <RouterLink to="/" aria-label="青い夏首页" class="brand-link flex items-center gap-2 hover:opacity-80 transition">
          <img :src="'/logo.svg'" alt="" class="w-7 h-7 rounded" />
          <span class="text-lg font-bold text-stone-100 tracking-wide">青い夏</span>
          <span class="brand-subtitle">AOINATSU</span>
        </RouterLink>

        <nav aria-label="主导航" class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            :class="[
              'nav-link px-3 rounded-full text-sm transition',
              isActive(item.path)
                ? 'bg-sky-900/40 text-sky-300'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            ]"
          >
            {{ item.text }}
          </RouterLink>
        </nav>

        <button
          @click="sidebarOpen = !sidebarOpen"
          class="md:hidden min-h-11 min-w-11 p-2 text-stone-300 hover:text-stone-100"
          :aria-label="sidebarOpen ? '关闭导航菜单' : '打开导航菜单'"
          :aria-expanded="sidebarOpen"
          aria-controls="mobile-navigation"
          @keydown.esc="sidebarOpen = false"
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
        id="mobile-navigation"
        @keydown.esc="sidebarOpen = false"
        class="fixed top-16 left-0 z-40 w-64 max-h-[50vh] bg-stone-950 border-r border-b border-stone-800 md:hidden overflow-y-auto rounded-b-lg"
      >
        <nav aria-label="移动导航" class="p-4 flex flex-col gap-1">
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
    <main class="relative z-10 flex-1">
      <div class="max-w-[1440px] mx-auto px-4" :class="route.path === '/games/civilization' ? 'py-3 md:py-4' : route.path === '/' ? 'home-container py-8 md:py-10' : 'py-8 md:py-12'">
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
        <div v-else class="mx-auto" :class="route.path === '/games/civilization' ? 'max-w-[1320px]' : route.path === '/' ? 'max-w-[1100px]' : 'max-w-4xl'">
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

<style scoped>
.site-header { background: rgb(10 23 27 / .88); backdrop-filter: blur(18px); border-bottom: 1px solid rgb(174 218 212 / .1); }
.header-inner { max-width: 1200px; height: 64px; }
.brand-link { min-height: 44px; }
.brand-subtitle { margin-left: 8px; padding-left: 14px; border-left: 1px solid #a5d8d32c; color: #a1babc; font-size: 9px; letter-spacing: .14em; }
.nav-link { display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; }
.nav-link[aria-current="page"] { color: #b9e8de; background: #8bd5cd12; }
.home-container { padding-inline: 24px; }
@media (max-width: 767px) { .brand-subtitle { font-size: 8px; } .home-container { padding-inline: 20px; } }
</style>
