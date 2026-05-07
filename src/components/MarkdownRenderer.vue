<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { parseMarkdown } from '../utils/markdown'

const props = defineProps<{
  content: string
  category?: string
}>()

const router = useRouter()

const rendered = computed(() => {
  if (!props.content) return ''
  return parseMarkdown(props.content, props.category)
})

function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement

  // Copy button
  const copyBtn = target.closest('.copy-btn')
  if (copyBtn) {
    const wrapper = copyBtn.closest('.code-block-wrapper')
    const codeEl = wrapper?.querySelector('code')
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent || '').then(() => {
        copyBtn.textContent = '已复制'
        setTimeout(() => { copyBtn.textContent = '复制' }, 1500)
      })
    }
    return
  }

  const anchor = target.closest('a')
  if (!anchor) return
  const href = anchor.getAttribute('href')
  if (!href) return

  // Build base URL for relative path resolution.
  // If the current path has no trailing slash and no file extension,
  // append / so that ./ resolves directory-relative, not file-relative.
  let base = window.location.href
  const path = window.location.pathname
  if (!path.endsWith('/') && !path.includes('.')) {
    base = window.location.origin + path + '/' + window.location.search + window.location.hash
  }

  const url = new URL(href, base)
  if (url.origin !== window.location.origin) return

  e.preventDefault()
  router.push(url.pathname + url.search + url.hash)
}
</script>

<template>
  <div class="markdown-body" v-html="rendered" @click="handleClick" />
</template>
