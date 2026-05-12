<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { toRomaji } from 'wanakana'

const tab = ref<'search' | 'flashcard'>('search')

// ── Search state ──
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

// ── Flashcard state ──
const CACHE_TARGET = 6
const entryCache = ref<Entry[]>([])
const currentEntry = ref<Entry | null>(null)
const isRevealed = ref(false)
const statusText = ref('')
const flashcardLoading = ref(true)
const flashcardError = ref('')

interface Sense { p: string[]; e: string[]; z: string[] }
interface Example { j: string; c: string }
interface Entry {
  k: string[]
  r: string[]
  o: string[]
  s: Sense[]
  x: Example[]
}

let allExamples: Entry[] = []

async function initDB() {
  flashcardLoading.value = true
  flashcardError.value = ''
  try {
    const resp = await fetch('/jmdict/examples.json')
    allExamples = await resp.json()
    flashcardLoading.value = false

    if (allExamples.length === 0) {
      flashcardError.value = 'No words with example sentences found.'
      return
    }

    await ensureCache(CACHE_TARGET)
    if (entryCache.value.length > 0) {
      showCard()
    } else {
      flashcardError.value = 'No words with example sentences found. Try again later.'
    }
  } catch (e) {
    flashcardError.value = 'Failed to load dictionary.'
    flashcardLoading.value = false
  }
}

async function ensureCache(minCount: number) {
  while (entryCache.value.length < minCount) {
    const batch = getRandomBatch(40)
    for (const entry of batch) {
      if (entry.x.length > 0) {
        entryCache.value.push(entry)
        if (entryCache.value.length >= minCount) break
      }
    }
  }
  updateStatus()
}

function getRandomBatch(size: number): Entry[] {
  const result: Entry[] = []
  const seen = new Set<number>()
  while (result.length < size && seen.size < allExamples.length) {
    const idx = Math.floor(Math.random() * allExamples.length)
    if (!seen.has(idx)) {
      seen.add(idx)
      result.push(allExamples[idx])
    }
  }
  return result
}

function highlightSentence(sentence: string, kanjiArr: string[], readingsArr: string[]) {
  const candidates = [...new Set(
    [...kanjiArr, ...readingsArr].filter((t: string) => {
      if (/^[぀-ゟ゠-ヿ]+$/.test(t)) return t.length >= 3
      return t.length > 0
    })
  )].sort((a: string, b: string) => b.length - a.length)
  let result = sentence
  for (const c of candidates) {
    result = result.replaceAll(c, '<mark>$&</mark>')
  }
  return result
}

function showCard() {
  if (entryCache.value.length === 0) return

  if (currentEntry.value && entryCache.value.length > 1) {
    const sameIdx = entryCache.value.findIndex(
      e => e.k.join(',') === currentEntry.value!.k.join(',') &&
           e.r.join(',') === currentEntry.value!.r.join(',')
    )
    if (sameIdx === 0 && entryCache.value.length > 1) {
      [entryCache.value[0], entryCache.value[1]] = [entryCache.value[1], entryCache.value[0]]
    }
  }

  currentEntry.value = entryCache.value.shift()!
  isRevealed.value = false
  updateStatus()

  if (entryCache.value.length <= 2) {
    ensureCache(CACHE_TARGET)
  }
}

function onCardTap() {
  if (!currentEntry.value || isRevealed.value) return
  isRevealed.value = true
}

function nextCard() {
  if (entryCache.value.length === 0) {
    flashcardError.value = 'No words found. Try again.'
    return
  }
  showCard()
}

function updateStatus() {
  statusText.value = entryCache.value.length > 0 ? `卡片缓存: ${entryCache.value.length}` : ''
}

function esc(s: string) {
  if (typeof s !== 'string') return ''
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function switchTab(t: 'search' | 'flashcard') {
  tab.value = t
  if (t === 'flashcard' && entryCache.value.length === 0) {
    initDB()
  }
}
</script>

<template>
  <div class="px-4 py-6 min-h-[70vh]">
    <!-- Tab bar -->
    <div class="max-w-[720px] mx-auto flex gap-1 mb-5 bg-stone-800 rounded-xl p-1">
      <span
        class="flex-1 text-center py-2.5 px-4 rounded-lg cursor-pointer text-sm font-medium"
        :class="tab === 'search' ? 'bg-stone-950 text-stone-200' : 'text-stone-500 hover:text-stone-300'"
        @click="switchTab('search')"
      >搜索</span>
      <span
        class="flex-1 text-center py-2.5 px-4 rounded-lg cursor-pointer text-sm font-medium"
        :class="tab === 'flashcard' ? 'bg-stone-950 text-stone-200' : 'text-stone-500 hover:text-stone-300'"
        @click="switchTab('flashcard')"
      >单词卡片</span>
    </div>

    <!-- Search tab -->
    <div v-if="tab === 'search'" class="max-w-[720px] mx-auto">
      <h1 class="text-center mb-6 text-2xl font-bold tracking-wide text-stone-100">JMdict</h1>

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

    <!-- Flashcard tab -->
    <div v-if="tab === 'flashcard'" class="max-w-[520px] mx-auto flex flex-col items-center">
      <div v-if="flashcardLoading" class="text-center text-stone-500 mt-16 text-base">Loading dictionary...</div>
      <div v-else-if="flashcardError" class="text-center text-stone-500 mt-10 text-sm leading-relaxed">{{ flashcardError }}</div>

      <template v-else-if="currentEntry">
        <div
          class="w-full border border-stone-700 rounded-2xl px-8 pt-10 pb-8 cursor-pointer min-h-[360px] flex flex-col"
          :class="isRevealed ? 'cursor-default' : ''"
          @click="onCardTap"
        >
          <div class="text-center mb-5">
            <div class="text-4xl font-bold text-stone-100 leading-tight">
              {{ currentEntry.k.length ? esc(currentEntry.k[0]) : esc(currentEntry.r[0]) }}
            </div>
            <div v-if="currentEntry.k.length" class="text-base text-stone-400 mt-1">
              {{ esc(currentEntry.r.join('、')) }}
            </div>
          </div>

          <div v-if="currentEntry.x[0]" class="bg-stone-800 border border-stone-700 rounded-xl px-4 py-4 text-center flex-1">
            <div class="text-[11px] text-stone-500 uppercase tracking-wider mb-2">例文</div>
            <div class="text-base leading-relaxed text-stone-200" v-html="highlightSentence(esc(currentEntry.x[0].j), currentEntry.k, currentEntry.r)"></div>
            <div class="text-sm text-stone-500 mt-1.5" :class="{ hidden: !isRevealed }">{{ esc(currentEntry.x[0].c) }}</div>
            <template v-if="currentEntry.x[1]">
              <div class="text-base leading-relaxed text-stone-200 mt-2.5" v-html="highlightSentence(esc(currentEntry.x[1].j), currentEntry.k, currentEntry.r)"></div>
              <div class="text-sm text-stone-500 mt-1.5" :class="{ hidden: !isRevealed }">{{ esc(currentEntry.x[1].c) }}</div>
            </template>
          </div>

          <div>
            <div
              class="overflow-hidden transition-all duration-300"
              :class="isRevealed ? 'max-h-[400px] opacity-100 mt-1 pt-4 border-t border-stone-700' : 'max-h-0 opacity-0'"
            >
              <div v-for="(s, i) in currentEntry.s.slice(0, 4)" :key="i" class="mb-2">
                <div v-if="s.p && s.p.length" class="text-[11px] text-stone-500 italic mb-1">{{ s.p.join(', ') }}</div>
                <div v-if="s.z && s.z.length && s.z[0]" class="text-sm text-stone-100 font-medium">{{ s.z.join('；') }}</div>
                <div class="text-sm text-stone-300">{{ s.e.join('; ') }}</div>
              </div>
              <div v-if="currentEntry.s.length > 4" class="text-[11px] text-stone-500 italic mt-1">+{{ currentEntry.s.length - 4 }} more senses</div>
            </div>
          </div>

          <div class="text-center text-stone-500 text-sm mt-4" :class="{ invisible: isRevealed }">点击卡片查看释义</div>
        </div>

        <div class="w-full mt-4 flex gap-2">
          <button class="flex-1 py-3.5 text-base font-medium bg-sky-700 text-white rounded-xl hover:bg-sky-600" @click="nextCard">下一张 →</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
:deep(mark) {
  background: none;
  color: #5eead4;
  font-weight: 700;
}
</style>
