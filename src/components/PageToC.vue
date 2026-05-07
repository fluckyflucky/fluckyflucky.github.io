<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface TocItem {
  id: string
  text: string
  level: number
}

const headings = ref<TocItem[]>([])
const activeId = ref('')

let observer: IntersectionObserver | null = null

function extractHeadings(): TocItem[] {
  const els = document.querySelectorAll('.markdown-body h2, .markdown-body h3')
  const result: TocItem[] = []
  els.forEach(el => {
    const id = el.getAttribute('id')
    if (id) {
      result.push({
        id,
        text: el.textContent || '',
        level: el.tagName === 'H3' ? 3 : 2,
      })
    }
  })
  return result
}

function setupObserver() {
  cleanupObserver()

  const observed = new Map<string, IntersectionObserverEntry>()
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        observed.set(entry.target.id, entry)
      }
      let firstVisible: string | null = null
      for (const h of headings.value) {
        const entry = observed.get(h.id)
        if (entry && entry.isIntersecting) {
          firstVisible = h.id
          break
        }
      }
      if (firstVisible) {
        activeId.value = firstVisible
      }
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
  )

  for (const h of headings.value) {
    const el = document.getElementById(h.id)
    if (el) observer.observe(el)
  }
}

function cleanupObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
  }
}

function refresh() {
  headings.value = extractHeadings()
  nextTick(() => setupObserver())
}

onMounted(() => {
  refresh()

  const mo = new MutationObserver(() => {
    const newHeadings = extractHeadings()
    if (newHeadings.length !== headings.value.length ||
        newHeadings.some((h, i) => h.id !== headings.value[i]?.id)) {
      refresh()
    }
  })
  const target = document.querySelector('main') || document.body
  mo.observe(target, { childList: true, subtree: true })

  onUnmounted(() => {
    mo.disconnect()
    cleanupObserver()
  })
})
</script>

<template>
  <aside v-if="headings.length > 0" class="toc hidden lg:block">
    <h2 class="toc-title">このページ</h2>
    <h2 class="toc-title">on this page</h2>
    <ul class="toc-list">
      <li v-for="h in headings" :key="h.id" :class="h.level === 3 ? 'ml-3' : ''">
        <a
          :class="['toc-link', activeId === h.id && 'active']"
          :href="`#${h.id}`"
          @click.prevent="scrollTo(h.id)"
        >
          {{ h.text }}
        </a>
      </li>
    </ul>
  </aside>
</template>

<style>
.toc {
  width: 12.5rem;
  flex-shrink: 0;
  max-height: calc(100vh - 5rem);
  overflow-y: auto;
}

.toc-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.75rem;
  margin-bottom: 0.75rem;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
  border-left: 0.125rem solid rgb(255 255 255 / 0.06);
}

.toc-link {
  display: block;
  font-size: 0.8125rem;
  color: #78716c;
  padding: 0.25rem 0.75rem;
  text-decoration: none;
  transition: color 0.15s;
  line-height: 1.5;
}

.toc-link:hover {
  color: #d6d3d1;
}

.toc-link.active {
  color: #7dd3fc;
}
</style>
