<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toRomaji } from 'wanakana'

const router = useRouter()
const query = ref('')
const results = ref<CompactEntry[]>([])
const searching = ref(false)
const count = ref(0)
const limit = ref(50)
const page = ref(1)
const totalPages = ref(0)

interface CompactSense { p: string[]; e: string[]; z: string[] }
interface CompactExample { j: string; c: string }
interface CompactEntry {
  k: string[]
  r: string[]
  o: string[]
  s: CompactSense[]
  x: CompactExample[]
}

const fileCache = new Map<string, any>()
async function fetchJSON(url: string): Promise<any> {
  if (fileCache.has(url)) return fileCache.get(url)
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('not found')
  const data = await resp.json()
  fileCache.set(url, data)
  return data
}

function isKana(ch: string): boolean { return /^[぀-ゟ゠-ヿ]$/.test(ch) }
function isKanji(ch: string): boolean { return /^[\p{Script=Han}]$/u.test(ch) }

function getRomajiPrefix(text: string): string {
  const r = toRomaji(text).toLowerCase().replace(/[^a-z]/g, '')
  return r.slice(0, 2)
}

function matchesPrefix(entry: CompactEntry, q: string, field: 'k' | 'r' | 'o'): boolean {
  return entry[field].some(v => v.toLowerCase().startsWith(q.toLowerCase()))
}

let timer: ReturnType<typeof setTimeout>
function onInput() {
  clearTimeout(timer)
  page.value = 1
  timer = setTimeout(doSearch, 200)
}

function onEnter() {
  clearTimeout(timer)
  page.value = 1
  doSearch()
}

function onLimitChange() {
  page.value = 1
  doSearch()
}

async function doSearch() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    count.value = 0
    totalPages.value = 0
    return
  }

  searching.value = true
  const seen = new Set<string>()
  const all: CompactEntry[] = []
  const firstChar = q[0]
  let prefixes: string[] = []

  if (isKanji(firstChar)) {
    try {
      const km = await fetchJSON('/jmdict/kanji-map.json')
      prefixes = km[firstChar] || km[q.slice(0, 2)] || []
    } catch (_) {}
  } else if (isKana(firstChar)) {
    prefixes = [getRomajiPrefix(firstChar)]
  } else {
    prefixes = [q.slice(0, 2).toLowerCase().replace(/[^a-z]/g, '')]
  }

  const pageStart = (page.value - 1) * limit.value
  let totalMatches = 0

  for (const prefix of prefixes) {
    try {
      const entries: CompactEntry[] = await fetchJSON(`/jmdict/ro/${prefix}.json`)

      for (const entry of entries) {
        const key = entry.k.join(',') + '|' + entry.r.join(',')

        if (seen.has(key)) continue

        let match = false
        if (isKanji(firstChar)) {
          match = matchesPrefix(entry, q, 'k')
        } else if (isKana(firstChar)) {
          match = matchesPrefix(entry, q, 'r')
        } else {
          match = entry.o.some(o => o.toLowerCase().startsWith(q.toLowerCase()))
          if (!match) match = matchesPrefix(entry, q, 'k') || matchesPrefix(entry, q, 'r')
        }

        if (match) {
          seen.add(key)
          totalMatches++
          if (totalMatches > pageStart && all.length < limit.value) {
            all.push(entry)
          }
        }
      }
    } catch (_) {}
  }

  results.value = all
  count.value = totalMatches
  totalPages.value = Math.ceil(totalMatches / limit.value)
  searching.value = false
}

function goToPage(n: number) {
  if (n < 1 || n > totalPages.value) return
  page.value = n
  doSearch()
}

const displayPages = computed(() => {
  const tp = totalPages.value
  const cp = page.value
  const pages: (number | string)[] = []

  if (tp <= 7) {
    for (let i = 1; i <= tp; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cp > 3) pages.push('...')
    for (let i = Math.max(2, cp - 1); i <= Math.min(tp - 1, cp + 1); i++) {
      pages.push(i)
    }
    if (cp < tp - 2) pages.push('...')
    pages.push(tp)
  }

  return pages
})
</script>

<template>
  <div class="px-4 py-6 min-h-[70vh]">
    <div class="max-w-[720px] mx-auto">
      <!-- Tab bar -->
      <div class="flex gap-1 mb-5 bg-stone-800 rounded-xl p-1">
        <span class="flex-1 text-center py-2.5 px-4 rounded-lg cursor-pointer text-sm font-medium bg-stone-950 text-stone-200">搜索</span>
        <span class="flex-1 text-center py-2.5 px-4 rounded-lg cursor-pointer text-sm font-medium text-stone-500 hover:text-stone-300" @click="router.push('/jmdict/flashcard')">单词卡片</span>
      </div>

      <h1 class="text-center mb-6 text-2xl font-bold tracking-wide text-stone-100">JMdict</h1>

      <!-- Search -->
      <div class="sticky top-14 z-10 py-3 mb-3 -mx-4 px-4 border-b border-stone-800">
        <div class="flex gap-2 max-w-[720px] mx-auto">
          <input
            v-model="query"
            type="text"
            placeholder="日本語・ローマ字..."
            class="flex-1 px-4 py-3 text-base border border-stone-700 rounded-xl outline-none bg-transparent text-stone-200 placeholder-stone-400 focus:border-stone-500 transition-colors min-w-0"
            @input="onInput"
            @keydown.enter="onEnter"
          />
          <select v-model="limit" @change="onLimitChange" class="px-3 py-2 text-sm border border-stone-700 rounded-xl outline-none bg-transparent text-stone-400">
            <option value="20">20件</option>
            <option value="50">50件</option>
            <option value="100">100件</option>
            <option value="200">200件</option>
            <option value="500">500件</option>
          </select>
        </div>
      </div>

      <!-- Count & Pagination -->
      <div v-if="count > 0" class="flex items-center justify-between mb-3">
        <div class="text-xs" :class="searching ? 'text-stone-500' : 'text-stone-600'">
          {{ searching ? '検索中...' : `${count} 件` }}
        </div>
        <div v-if="totalPages > 1" class="flex items-center gap-0.5">
          <button
            class="px-2 py-1 text-xs rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="page === 1"
            @click="goToPage(1)"
          >«</button>
          <button
            class="px-2 py-1 text-xs rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="page === 1"
            @click="goToPage(page - 1)"
          >‹</button>
          <template v-for="p in displayPages" :key="p">
            <span v-if="p === '...'" class="px-1 text-xs text-stone-600">...</span>
            <button
              v-else
              class="px-2 py-1 text-xs rounded-md"
              :class="p === page ? 'bg-sky-700 text-white' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'"
              @click="goToPage(p as number)"
            >{{ p }}</button>
          </template>
          <button
            class="px-2 py-1 text-xs rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="page === totalPages"
            @click="goToPage(page + 1)"
          >›</button>
          <button
            class="px-2 py-1 text-xs rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="page === totalPages"
            @click="goToPage(totalPages)"
          >»</button>
        </div>
      </div>
      <div v-else-if="searching" class="text-center text-stone-600 text-xs mb-2">検索中...</div>

      <!-- Results -->
      <div v-if="!query" class="text-center text-stone-400 mt-16 text-base">输入关键词开始搜索</div>
      <div v-else-if="!searching && count === 0" class="text-center text-stone-600 mt-16 text-base">未找到结果</div>

      <div
        v-for="e in results"
        :key="e.k.join() + e.r.join()"
        class="border-b border-stone-800 py-4 last:border-b-0"
      >
        <div class="mb-2">
          <span v-if="e.k.length" class="text-xl font-bold text-stone-100">{{ e.k.join('、') }}</span>
          <span class="text-sm text-stone-500 ml-2">{{ e.r.join('、') }}</span>
        </div>

        <div v-for="(s, i) in e.s" :key="i" class="mt-2 pl-3 border-l-2 border-stone-700">
          <div v-if="s.p && s.p.length" class="text-[11px] text-stone-500 italic mb-0.5">{{ s.p.join(', ') }}</div>
          <div v-if="s.z && s.z.length && s.z[0]" class="text-sm text-stone-200 font-medium mt-0.5">{{ i + 1 }}. {{ s.z.join('; ') }}</div>
          <div class="text-sm text-stone-400">{{ s.e.join('; ') }}</div>
        </div>

        <div v-if="e.x && e.x.length" class="mt-2 pt-2 border-t border-stone-800">
          <div v-for="(ex, i) in e.x" :key="i" class="mt-1.5 text-xs leading-relaxed">
            <span class="block text-stone-300">{{ ex.j }}</span>
            <span class="block text-stone-600">{{ ex.c }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
