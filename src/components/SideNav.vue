<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sidebar } from '../data/sidebar'

const route = useRoute()
const router = useRouter()

const group = computed(() => {
  const path = route.path
  for (const [prefix, g] of Object.entries(sidebar)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return g
    }
  }
  return null
})

const isActive = (link: string) => route.path === link

function goTo(link: string) {
  router.push(link)
}
</script>

<template>
  <nav v-if="group" class="side-nav hidden md:block">
    <h2 class="side-nav-title">{{ group.text }}</h2>
    <ul class="side-nav-list">
      <li v-for="item in group.items" :key="item.link">
        <button
          :class="['side-nav-link', isActive(item.link) && 'active']"
          @click="goTo(item.link)"
        >
          {{ item.text }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style>
.side-nav {
  width: 13.75rem;
  flex-shrink: 0;
  max-height: calc(100vh - 5rem);
  overflow-y: auto;
}

.side-nav-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.75rem;
  margin-bottom: 0.75rem;
}

.side-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.side-nav-link {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 0.875rem;
  color: #78716c;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: none;
  background: none;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
  line-height: 1.5;
}

.side-nav-link:hover {
  color: #d6d3d1;
  background: rgb(255 255 255 / 0.05);
}

.side-nav-link.active {
  color: #7dd3fc;
  background: rgb(56 189 248 / 0.1);
}
</style>
