<script setup lang="ts">
import { ref } from 'vue'
import JsonNode from '../components/JsonNode.vue'

const input = ref('')
const output = ref('')
const parsedData = ref<unknown>(null)
const error = ref('')

function format() {
  try {
    error.value = ''
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj, null, 2)
    parsedData.value = obj
  } catch (e: any) {
    error.value = 'JSON 格式错误: ' + e.message
    output.value = ''
    parsedData.value = null
  }
}

function compress() {
  try {
    error.value = ''
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj)
    parsedData.value = obj
  } catch (e: any) {
    error.value = 'JSON 格式错误: ' + e.message
    output.value = ''
    parsedData.value = null
  }
}

function clear() {
  input.value = ''
  output.value = ''
  parsedData.value = null
  error.value = ''
}

async function copy() {
  await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-stone-100">JSON 格式化</h1>
    <div class="flex gap-4 mb-4 flex-col md:flex-row">
      <div class="flex-1 min-w-0 flex flex-col">
        <label class="font-semibold mb-1.5 text-sky-400 text-sm">输入 JSON</label>
        <textarea
          v-model="input"
          placeholder='{"key": "value"}'
          class="w-full font-mono text-sm p-3 border border-stone-700 rounded-lg bg-stone-900 text-stone-200 resize-none focus:outline-none focus:border-sky-600 h-80"
        ></textarea>
      </div>
      <div class="flex-1 md:flex-[2] min-w-0 flex flex-col">
        <label class="font-semibold mb-1.5 text-sky-400 text-sm">输出结果</label>
        <div
          class="w-full font-mono text-sm p-3 border border-stone-700 rounded-lg bg-stone-900 text-stone-200 overflow-auto h-80 whitespace-nowrap"
        >
          <JsonNode v-if="parsedData !== null" :data="parsedData" />
          <span v-else class="text-stone-500">格式化结果</span>
        </div>
      </div>
    </div>
    <p v-if="error" class="text-red-400 text-sm mb-3">{{ error }}</p>
    <div class="flex gap-2 flex-wrap">
      <button @click="format" class="px-5 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-500 transition">格式化</button>
      <button @click="compress" class="px-5 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-500 transition">压缩</button>
      <button @click="copy" :disabled="!output" class="px-5 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-500 transition disabled:opacity-40 disabled:cursor-not-allowed">复制结果</button>
      <button @click="clear" class="px-5 py-2 bg-stone-700 text-stone-200 rounded-md text-sm hover:bg-stone-600 transition">清空</button>
    </div>
  </div>
</template>
