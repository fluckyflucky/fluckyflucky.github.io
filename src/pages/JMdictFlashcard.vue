<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const error = ref('')

interface Sense { p: string[]; e: string[]; z: string[] }
interface Example { j: string; c: string }
interface Entry {
  k: string[]
  r: string[]
  o: string[]
  s: Sense[]
  x: Example[]
}

const CACHE_TARGET = 6
const entryCache = ref<Entry[]>([])
const currentEntry = ref<Entry | null>(null)
const isRevealed = ref(false)
const statusText = ref('')

let allExamples: Entry[] = []

async function initDB() {
  try {
    const resp = await fetch('/jmdict/examples.json')
    allExamples = await resp.json()
    loading.value = false

    if (allExamples.length === 0) {
      error.value = 'No words with example sentences found.'
      return
    }

    await ensureCache(CACHE_TARGET)
    if (entryCache.value.length > 0) {
      showCard()
    } else {
      error.value = 'No words with example sentences found. Try again later.'
    }
  } catch (e) {
    error.value = 'Failed to load dictionary.'
    loading.value = false
  }
}

onMounted(initDB)

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
    error.value = 'No words found. Try again.'
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
</script>

<template>
  <div class="px-4 py-6 min-h-[70vh] flex flex-col items-center">
    <div class="max-w-[520px] w-full flex flex-col items-center">
      <!-- Tab bar -->
      <div class="flex gap-1 mb-5 bg-stone-800 rounded-xl p-1 w-full">
        <span class="flex-1 text-center py-2.5 px-4 rounded-lg cursor-pointer text-sm font-medium text-stone-500 hover:text-stone-300" @click="router.push('/jmdict')">搜索</span>
        <span class="flex-1 text-center py-2.5 px-4 rounded-lg cursor-pointer text-sm font-medium bg-stone-950 text-stone-200">单词卡片</span>
      </div>

      <div v-if="loading" class="text-center text-stone-600 mt-16 text-base">Loading dictionary...</div>
      <div v-else-if="error" class="text-center text-stone-600 mt-10 text-sm leading-relaxed">{{ error }}</div>

      <template v-else-if="currentEntry">
        <div
          class="w-full border border-stone-800 rounded-2xl px-8 pt-10 pb-8 cursor-pointer min-h-[360px] flex flex-col"
          :class="isRevealed ? 'cursor-default' : ''"
          @click="onCardTap"
        >
          <!-- Word -->
          <div class="text-center mb-5">
            <div class="text-4xl font-bold text-stone-100 leading-tight">
              {{ currentEntry.k.length ? esc(currentEntry.k[0]) : esc(currentEntry.r[0]) }}
            </div>
            <div v-if="currentEntry.k.length" class="text-base text-stone-500 mt-1">
              {{ esc(currentEntry.r.join('、')) }}
            </div>
          </div>

          <!-- Sentence -->
          <div v-if="currentEntry.x[0]" class="bg-stone-900 border border-stone-800 rounded-xl px-4 py-4 text-center flex-1">
            <div class="text-[11px] text-stone-600 uppercase tracking-wider mb-2">例文</div>
            <div class="text-base leading-relaxed text-stone-300" v-html="highlightSentence(esc(currentEntry.x[0].j), currentEntry.k, currentEntry.r)"></div>
            <div class="text-sm text-stone-600 mt-1.5" :class="{ hidden: !isRevealed }">{{ esc(currentEntry.x[0].c) }}</div>
            <template v-if="currentEntry.x[1]">
              <div class="text-base leading-relaxed text-stone-300 mt-2.5" v-html="highlightSentence(esc(currentEntry.x[1].j), currentEntry.k, currentEntry.r)"></div>
              <div class="text-sm text-stone-600 mt-1.5" :class="{ hidden: !isRevealed }">{{ esc(currentEntry.x[1].c) }}</div>
            </template>
          </div>

          <!-- Meanings -->
          <div>
            <div
              class="overflow-hidden transition-all duration-300"
              :class="isRevealed ? 'max-h-[400px] opacity-100 mt-1 pt-4 border-t border-stone-800' : 'max-h-0 opacity-0'"
            >
              <div v-for="(s, i) in currentEntry.s.slice(0, 4)" :key="i" class="mb-2">
                <div v-if="s.p && s.p.length" class="text-[11px] text-stone-600 italic mb-1">{{ s.p.join(', ') }}</div>
                <div v-if="s.z && s.z.length && s.z[0]" class="text-sm text-stone-200 font-medium">{{ s.z.join('；') }}</div>
                <div class="text-sm text-stone-400">{{ s.e.join('; ') }}</div>
              </div>
              <div v-if="currentEntry.s.length > 4" class="text-[11px] text-stone-600 italic mt-1">+{{ currentEntry.s.length - 4 }} more senses</div>
            </div>
          </div>

          <div class="text-center text-stone-600 text-sm mt-4" :class="{ invisible: isRevealed }">点击卡片查看释义</div>
        </div>

        <div class="w-full mt-4 flex gap-2">
          <button class="flex-1 py-3.5 text-base font-medium bg-sky-700 text-white rounded-xl hover:bg-sky-600" @click="nextCard">下一张 →</button>
        </div>
        <div class="text-center text-stone-600 text-xs mt-3">{{ statusText }}</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
:deep(mark) {
  background: none;
  color: #38bdf8;
  font-weight: 600;
}
</style>
