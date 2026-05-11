<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import initSqlJs from 'sql.js'

const router = useRouter()
const query = ref('')
const results = ref<any[]>([])
const loading = ref(true)
const count = ref(0)
const limit = ref(50)

let db: any = null

async function initDB() {
  const SQL = await initSqlJs({
    locateFile: (file: string) => `/jmdict/sql-wasm.wasm`
  })
  const response = await fetch('/jmdict/dict.db')
  const buf = await response.arrayBuffer()
  db = new SQL.Database(new Uint8Array(buf))
  loading.value = false
}

onMounted(initDB)

let timer: ReturnType<typeof setTimeout>
function onInput() {
  clearTimeout(timer)
  timer = setTimeout(doSearch, 300)
}

function doSearch() {
  if (!db) return
  if (!query.value.trim()) {
    results.value = []
    count.value = 0
    return
  }
  const entries = search(query.value.trim(), limit.value)
  results.value = entries
  count.value = entries.length
}

function search(q: string, lim: number) {
  const escaped = q.replace(/'/g, "''")
  const seen = new Set<string>()
  const all: any[] = []

  const prefix = db.exec(
    "SELECT kanji, readings, senses_json, examples_json FROM entries WHERE kanji LIKE ? OR readings LIKE ? OR romaji LIKE ? LIMIT ?",
    [escaped + '%', escaped + '%', escaped + '%', lim]
  )
  if (prefix.length && prefix[0].values.length) {
    for (const row of prefix[0].values) {
      const entry = parseRow(row)
      const key = entry.kanji.join(',') + entry.readings.join(',')
      if (!seen.has(key)) { seen.add(key); all.push(entry) }
    }
  }

  if (all.length < lim) {
    const remaining = lim - all.length
    const ftsQuery = q.replace(/['"]/g, '')
    try {
      const fts = db.exec(
        `SELECT e.kanji, e.readings, e.senses_json, e.examples_json FROM entries_fts f
         JOIN entries e ON e.rowid = f.rowid
         WHERE entries_fts MATCH '"${ftsQuery}"'
         LIMIT ?`,
        [remaining]
      )
      if (fts.length && fts[0].values.length) {
        for (const row of fts[0].values) {
          const entry = parseRow(row)
          const key = entry.kanji.join(',') + entry.readings.join(',')
          if (!seen.has(key)) { seen.add(key); all.push(entry) }
        }
      }
    } catch (_) {}
  }
  return all
}

function parseRow(row: any[]) {
  return {
    kanji: row[0] ? row[0].split(',') : [],
    readings: row[1] ? row[1].split(',') : [],
    senses: JSON.parse(row[2]),
    examples: row[3] ? JSON.parse(row[3]) : [],
  }
}
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
            placeholder="日本語・中文・ローマ字..."
            :disabled="loading"
            class="flex-1 px-4 py-3 text-base border border-stone-700 rounded-xl outline-none bg-transparent text-stone-200 placeholder-stone-400 focus:border-stone-500 transition-colors min-w-0"
            @input="onInput"
            @keydown.enter="doSearch"
          />
          <select v-model="limit" class="px-3 py-2 text-sm border border-stone-700 rounded-xl outline-none bg-transparent text-stone-400">
            <option value="20">20件</option>
            <option value="50">50件</option>
            <option value="100">100件</option>
            <option value="200">200件</option>
            <option value="500">500件</option>
          </select>
          <button
            :disabled="loading"
            class="px-6 py-3 text-sm font-medium bg-sky-700 text-white rounded-xl whitespace-nowrap hover:bg-sky-600 disabled:bg-stone-700 disabled:text-stone-600 disabled:cursor-not-allowed"
            @click="doSearch"
          >検索</button>
        </div>
      </div>

      <div v-if="count > 0" class="text-center text-stone-600 text-xs mb-2">{{ count }} 件</div>

      <div v-if="loading" class="text-center text-stone-600 mt-16 text-base">Loading dictionary...</div>
      <div v-else-if="count === 0 && query" class="text-center text-stone-600 mt-16 text-base">未找到结果</div>
      <div v-else-if="!query" class="text-center text-stone-400 mt-16 text-base">输入关键词开始搜索</div>

      <div
        v-for="e in results"
        :key="e.kanji.join() + e.readings.join()"
        class="border-b border-stone-800 py-4 last:border-b-0"
      >
        <div class="mb-2">
          <span v-if="e.kanji.length" class="text-xl font-bold text-stone-100">{{ e.kanji.join('、') }}</span>
          <span class="text-sm text-stone-500 ml-2">{{ e.readings.join('、') }}</span>
        </div>

        <div v-for="(s, i) in e.senses" :key="i" class="mt-2 pl-3 border-l-2 border-stone-700">
          <div v-if="s.pos && s.pos.length" class="text-[11px] text-stone-500 italic mb-0.5">{{ s.pos.join(', ') }}</div>
          <div v-if="s.zh && s.zh.length && s.zh[0]" class="text-sm text-stone-200 font-medium mt-0.5">{{ i + 1 }}. {{ s.zh.join('; ') }}</div>
          <div class="text-sm text-stone-400">{{ s.en.join('; ') }}</div>
        </div>

        <div v-if="e.examples && e.examples.length" class="mt-2 pt-2 border-t border-stone-800">
          <div v-for="(ex, i) in e.examples" :key="i" class="mt-1.5 text-xs leading-relaxed">
            <span class="block text-stone-300">{{ ex.ja }}</span>
            <span class="block text-stone-600">{{ ex.zh }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
