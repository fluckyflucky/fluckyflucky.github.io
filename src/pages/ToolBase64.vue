<script setup lang="ts">
import { ref } from 'vue'

const input = ref('')
const output = ref('')
const error = ref('')

function encode() {
  try {
    error.value = ''
    output.value = btoa(unescape(encodeURIComponent(input.value)))
  } catch (e: any) {
    error.value = '编码失败: ' + e.message
    output.value = ''
  }
}

function decode() {
  try {
    error.value = ''
    output.value = decodeURIComponent(escape(atob(input.value.trim())))
  } catch (e: any) {
    error.value = '解码失败: 输入不是有效的 Base64 字符串'
    output.value = ''
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
}

async function copy() {
  await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-stone-100">Base64 编解码</h1>
    <div class="flex gap-4 mb-4 flex-col md:flex-row">
      <div class="flex-1 flex flex-col">
        <label class="font-semibold mb-1.5 text-sky-400 text-sm">输入文本</label>
        <textarea
          v-model="input"
          rows="10"
          placeholder="输入要编码或解码的内容"
          class="w-full font-mono text-sm p-3 border border-stone-700 rounded-lg bg-stone-900 text-stone-200 resize-y focus:outline-none focus:border-sky-600"
        ></textarea>
      </div>
      <div class="flex-1 flex flex-col">
        <label class="font-semibold mb-1.5 text-sky-400 text-sm">输出结果</label>
        <textarea
          v-model="output"
          rows="10"
          readonly
          placeholder="结果"
          class="w-full font-mono text-sm p-3 border border-stone-700 rounded-lg bg-stone-900 text-stone-200 resize-y focus:outline-none"
        ></textarea>
      </div>
    </div>
    <p v-if="error" class="text-red-400 text-sm mb-3">{{ error }}</p>
    <div class="flex gap-2 flex-wrap">
      <button @click="encode" class="px-5 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-500 transition">编码</button>
      <button @click="decode" class="px-5 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-500 transition">解码</button>
      <button @click="copy" :disabled="!output" class="px-5 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-500 transition disabled:opacity-40 disabled:cursor-not-allowed">复制结果</button>
      <button @click="clear" class="px-5 py-2 bg-stone-700 text-stone-200 rounded-md text-sm hover:bg-stone-600 transition">清空</button>
    </div>
  </div>
</template>
