<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'

const props = defineProps<{
  category: string
  slug: string
}>()

const content = ref('')
const loading = ref(true)
const error = ref('')

// Extract first heading as page title
const pageTitle = computed(() => {
  const match = content.value.match(/^# (.+)$/m)
  return match ? match[1] : props.slug || props.category
})

// Update document title
watch(pageTitle, (title) => {
  document.title = title ? `${title} — 青い夏的世界` : '青い夏的世界'
}, { immediate: true })

async function loadContent(cat: string, slug: string) {
  loading.value = true
  error.value = ''
  try {
    let url: string
    if (cat === '') {
      url = '/markdown/404.md'
    } else {
      url = `/markdown/${cat}/${slug}.md`
    }
    const res = await fetch(url)
    if (!res.ok) throw new Error('Page not found')
    content.value = await res.text()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadContent(props.category, props.slug)
})

watch([() => props.category, () => props.slug], ([newCat, newSlug]) => {
  loadContent(newCat, newSlug)
})
</script>

<template>
  <div v-if="loading" class="flex justify-center py-20">
    <div class="animate-pulse text-stone-500">読み込み中...</div>
  </div>
  <div v-else-if="error" class="text-center py-20">
    <p class="text-6xl mb-4">404</p>
    <p class="text-stone-400">ページが見つかりません</p>
  </div>
  <MarkdownRenderer v-else :content="content" :category="props.category" />
</template>
