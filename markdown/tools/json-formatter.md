---
title: JSON 格式化
---

# JSON 格式化

<script setup>
import { ref } from 'vue'

const input = ref('')
const output = ref('')
const error = ref('')

function format() {
  try {
    error.value = ''
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj, null, 2)
  } catch (e) {
    error.value = 'JSON 格式错误: ' + e.message
    output.value = ''
  }
}

function compress() {
  try {
    error.value = ''
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj)
  } catch (e) {
    error.value = 'JSON 格式错误: ' + e.message
    output.value = ''
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
}

function copy() {
  navigator.clipboard.writeText(output.value)
}
</script>

<div class="tool-container">
  <div class="tool-row">
    <div class="tool-col">
      <label>输入 JSON</label>
      <textarea v-model="input" rows="12" placeholder='{"key": "value"}'></textarea>
    </div>
    <div class="tool-col">
      <label>输出结果</label>
      <textarea v-model="output" rows="12" readonly placeholder="格式化结果"></textarea>
    </div>
  </div>
  <p v-if="error" class="tool-error">{{ error }}</p>
  <div class="tool-actions">
    <button @click="format">格式化</button>
    <button @click="compress">压缩</button>
    <button @click="copy" :disabled="!output">复制结果</button>
    <button @click="clear" class="btn-secondary">清空</button>
  </div>
</div>

<style scoped>
.tool-container {
  margin-top: 16px;
}
.tool-row {
  display: flex;
  gap: 16px;
}
.tool-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.tool-col label {
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--vp-c-brand-1);
}
.tool-col textarea {
  width: 100%;
  font-family: monospace;
  font-size: 13px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  resize: vertical;
}
.tool-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.tool-actions button {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.tool-actions button:hover {
  opacity: 0.85;
}
.tool-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tool-actions .btn-secondary {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}
.tool-error {
  color: #ef4444;
  margin-top: 8px;
  font-size: 13px;
}
@media (max-width: 640px) {
  .tool-row { flex-direction: column; }
}
</style>
